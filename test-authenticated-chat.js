#!/usr/bin/env node

/**
 * Chat Flow Test with Authentication
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Centrifuge } = require('centrifuge');

const API_BASE = 'http://localhost:3000/api';
const CENTRIFUGO_WS = 'ws://localhost:8000/connection/websocket';
const JWT_SECRET = 'worklab_jwt_secret_2024_secure_key';

// Generate a valid JWT token for user 1
function generateAuthToken(userId) {
  return jwt.sign(
    { userId, email: `user${userId}@example.com` },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runTest() {
  console.log('\n========================================');
  console.log('   AUTHENTICATED CHAT FLOW TEST');
  console.log('========================================\n');

  try {
    const token = generateAuthToken(1);
    console.log('1️⃣ Generated auth token for user 1');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // Get Centrifugo token
    console.log('2️⃣ Getting Centrifugo token...');
    const centrifugoResp = await axios.post(`${API_BASE}/centrifugo/token`, {
      userId: '1'
    });
    const centrifugoToken = centrifugoResp.data.data.token;
    console.log('✅ Centrifugo token received\n');

    // Connect to Centrifugo
    console.log('3️⃣ Connecting to Centrifugo...');
    const centrifuge = new Centrifuge(CENTRIFUGO_WS, { token: centrifugoToken });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      centrifuge.on('connected', () => {
        clearTimeout(timeout);
        console.log('✅ Connected\n');
        resolve();
      });
      centrifuge.on('error', reject);
      centrifuge.connect();
    });

    // Subscribe to channel
    console.log('4️⃣ Subscribing to conversation channel (1:2)...');
    const channel = 'conversation:1:2';
    const subscription = centrifuge.newSubscription(channel);
    
    let messageReceived = false;
    
    subscription.on('publication', (ctx) => {
      console.log('   ✅ REAL-TIME MESSAGE RECEIVED!');
      console.log(`   Data: ${JSON.stringify(ctx.data).substring(0, 100)}...`);
      messageReceived = true;
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      subscription.on('subscribed', () => {
        clearTimeout(timeout);
        console.log('✅ Subscribed to channel\n');
        resolve();
      });
      subscription.on('error', reject);
      subscription.subscribe();
    });

    // Send a message
    console.log('5️⃣ Sending message via API...');
    console.log(`   Auth: Bearer ${token.substring(0, 30)}...`);
    
    const messageResp = await axios.post(
      `${API_BASE}/messages`,
      {
        receiverId: 2,
        content: `✅ Real-time test message at ${new Date().toLocaleTimeString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Message sent via API');
    console.log(`   Message ID: ${messageResp.data.data.id}`);
    console.log(`   Content: ${messageResp.data.data.content}\n`);

    // Wait for real-time delivery
    console.log('6️⃣ Waiting for real-time message...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No real-time message received within 3 seconds'));
      }, 3000);
      
      const interval = setInterval(() => {
        if (messageReceived) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    // Cleanup
    console.log('\n7️⃣ Cleaning up...');
    subscription.unsubscribe();
    centrifuge.disconnect();
    console.log('✅ Disconnected\n');

    console.log('========================================');
    console.log('   ✅ ALL TESTS PASSED!');
    console.log('   Chat messaging is working perfectly');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    if (error.response?.data) {
      console.error('API Response:', error.response.data);
    }
    if (error.response?.status === 401) {
      console.error('Note: Auth failed - ensure users exist in database');
    }
    console.log('========================================\n');
    process.exit(1);
  }
}

runTest();
