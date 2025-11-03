const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { validationResult } = require('express-validator');

// @desc    Purchase connects
// @route   POST /api/connects/purchase
// @access  Private
const purchaseConnects = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { quantity, paymentMethodId } = req.body;
  const userId = req.userId;

  // Connect pricing (you can make this configurable)
  const connectPrice = 0.15; // $0.15 per connect
  const totalAmount = quantity * connectPrice;

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.CLIENT_URL}/connects/success`,
      metadata: {
        userId: userId.toString(),
        quantity: quantity.toString(),
        type: 'connect_purchase'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      // Use transaction to ensure atomicity
      const transaction = await db.sequelize.transaction();
      
      try {
        // Create connect record
        const connect = await db.Connect.create({
          userId,
          type: 'purchased',
          amount: totalAmount,
          quantity,
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge,
          status: 'completed',
          remaining: quantity,
          metadata: {
            paymentIntentId: paymentIntent.id,
            chargeId: paymentIntent.latest_charge
          }
        }, { transaction });

        // Update user's connect balance
        const user = await db.User.findByPk(userId, { transaction });
        await user.update({
          connectBalance: user.connectBalance + quantity
        }, { transaction });

        // Commit transaction
        await transaction.commit();

        res.json({
          message: 'Connects purchased successfully',
          connect,
          newBalance: user.connectBalance + quantity
        });
      } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
      }
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// @desc    Get user's connects
// @route   GET /api/connects
// @access  Private
const getConnects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = { userId };
  if (type) {
    whereClause.type = type;
  }

  const connects = await db.Connect.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: offset,
    order: [['createdAt', 'DESC']]
  });

  // Get user's current balance
  const user = await db.User.findByPk(userId);

  res.json({
    connects: connects.rows,
    currentBalance: user.connectBalance,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(connects.count / parseInt(limit)),
      totalConnects: connects.count,
      connectsPerPage: parseInt(limit)
    }
  });
});

// @desc    Get connect statistics
// @route   GET /api/connects/statistics
// @access  Private
const getConnectStatistics = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const totalPurchased = await db.Connect.sum('quantity', {
    where: { userId, type: 'purchased', status: 'completed' }
  }) || 0;

  // Calculate total used from all connect records
  const totalUsed = await db.Connect.sum('used', {
    where: { userId }
  }) || 0;

  const totalEarned = await db.Connect.sum('quantity', {
    where: { userId, type: 'earned', status: 'completed' }
  }) || 0;

  const totalSpent = await db.Connect.sum('amount', {
    where: { userId, type: 'purchased', status: 'completed' }
  }) || 0;

  const user = await db.User.findByPk(userId);

  res.json({
    currentBalance: user.connectBalance,
    totalPurchased,
    totalUsed,
    totalEarned,
    totalSpent,
    availableConnects: user.connectBalance
  });
});

// @desc    Create payment intent for connects
// @route   POST /api/connects/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const userId = req.userId;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  const connectPrice = 0.15;
  const totalAmount = quantity * connectPrice;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        quantity: quantity.toString(),
        type: 'connect_purchase'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      quantity
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// @desc    Confirm payment and add connects
// @route   POST /api/connects/confirm-payment
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.userId;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Check if connects already added for this payment
    const existingConnect = await db.Connect.findOne({
      where: { stripePaymentIntentId: paymentIntentId }
    });

    if (existingConnect) {
      return res.status(400).json({ error: 'Connects already added for this payment' });
    }

    const quantity = parseInt(paymentIntent.metadata.quantity);
    const amount = paymentIntent.amount / 100;

    // Use transaction to ensure atomicity
    const transaction = await db.sequelize.transaction();
    
    try {
      // Create connect record
      const connect = await db.Connect.create({
        userId,
        type: 'purchased',
        amount,
        quantity,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: paymentIntent.latest_charge,
        status: 'completed',
        remaining: quantity,
        metadata: {
          paymentIntentId,
          chargeId: paymentIntent.latest_charge
        }
      }, { transaction });

      // Update user's connect balance
      const user = await db.User.findByPk(userId, { transaction });
      await user.update({
        connectBalance: user.connectBalance + quantity
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      res.json({
        message: 'Connects added successfully',
        connect,
        newBalance: user.connectBalance
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// @desc    Use connects for job application
// @route   POST /api/connects/use
// @access  Private
const useConnects = asyncHandler(async (req, res) => {
  const { quantity, jobApplicationId } = req.body;
  const userId = req.userId;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  // Check if user has enough connects
  const user = await db.User.findByPk(userId);
  if (user.connectBalance < quantity) {
    return res.status(400).json({ 
      error: 'Insufficient connects',
      required: quantity,
      available: user.connectBalance
    });
  }

  // Update user's connect balance (no need to create a separate "used" record)
  const newBalance = user.connectBalance - quantity;
  await user.update({
    connectBalance: newBalance
  });

  // Optionally: Update existing connect records to mark them as used
  // For now, we just track the balance change

  res.json({
    message: 'Connects used successfully',
    quantity,
    newBalance
  });
});

// @desc    Get connect packages
// @route   GET /api/connects/packages
// @access  Public
const getConnectPackages = asyncHandler(async (req, res) => {
  const packages = [
    {
      id: 'basic',
      name: 'Basic Package',
      quantity: 10,
      price: 1.50,
      bonus: 0,
      description: 'Perfect for getting started'
    },
    {
      id: 'standard',
      name: 'Standard Package',
      quantity: 50,
      price: 7.50,
      bonus: 5,
      description: 'Great value for regular users'
    },
    {
      id: 'premium',
      name: 'Premium Package',
      quantity: 100,
      price: 15.00,
      bonus: 15,
      description: 'Best value for power users'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      quantity: 500,
      price: 75.00,
      bonus: 100,
      description: 'For agencies and high-volume users'
    }
  ];

  res.json({ packages });
});

// @desc    Add connects directly (for testing)
// @route   POST /api/connects/add
// @access  Private
const addConnects = asyncHandler(async (req, res) => {
  const { quantity, type = 'bonus' } = req.body;
  const userId = req.userId;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    // Create connect record
    const connect = await db.Connect.create({
      userId,
      quantity,
      type,
      amount: 0, // Free connects for testing
      status: 'completed',
      remaining: quantity,
      metadata: {
        description: `Added ${quantity} connects for testing`
      }
    });

    // Update user's connect balance
    const user = await db.User.findByPk(userId);
    if (user) {
      user.connectBalance = (user.connectBalance || 0) + quantity;
      await user.save();
    }

    res.json({
      success: true,
      message: `Added ${quantity} connects successfully`,
      connect,
      newBalance: user.connectBalance
    });
  } catch (error) {
    console.error('Error adding connects:', error);
    res.status(500).json({ error: 'Failed to add connects' });
  }
});

module.exports = {
  purchaseConnects,
  getConnects,
  getConnectStatistics,
  createPaymentIntent,
  confirmPayment,
  useConnects,
  getConnectPackages,
  addConnects
};