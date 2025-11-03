const { body, param, query } = require('express-validator');

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('userType')
    .isIn(['freelancer', 'client', 'agency'])
    .withMessage('User type must be freelancer, client, or agency')
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Job application validation
const validateJobApplication = [
  body('jobPostId')
    .isInt({ min: 1 })
    .withMessage('Valid job post ID is required'),
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter must not exceed 2000 characters'),
  body('proposedRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed rate must be a positive number'),
  body('proposedTimeline')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Proposed timeline must not exceed 200 characters'),
  body('additionalInfo')
    .optional()
    .isObject()
    .withMessage('Additional info must be an object'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

// Connect purchase validation
const validateConnectPurchase = [
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
];

// Contract creation validation
const validateContractCreation = [
  body('freelancerId')
    .isInt({ min: 1 })
    .withMessage('Valid freelancer ID is required'),
  body('workTitle')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Work title must be between 1 and 200 characters'),
  body('workDescription')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Work description must be between 1 and 2000 characters'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('paymentSchedule')
    .optional()
    .isIn(['hourly', 'fixed', 'milestone'])
    .withMessage('Payment schedule must be hourly, fixed, or milestone'),
  body('contractStartDate')
    .isISO8601()
    .withMessage('Valid contract start date is required'),
  body('contractEndDate')
    .optional()
    .isISO8601()
    .withMessage('Valid contract end date is required')
];

// Message validation
const validateMessage = [
  body('receiverId')
    .isInt({ min: 1 })
    .withMessage('Valid receiver ID is required'),
  // Allow empty content for certain message types (e.g., video_call invites which carry JSON)
  body('content')
    .custom((value, { req }) => {
      const type = req.body.messageType || 'text';
      if (type === 'video_call' || type === 'contract') {
        // Allow empty string or JSON string up to 4000 chars
        if (typeof value === 'undefined' || value === null) return true;
        if (typeof value === 'string' && value.length <= 4000) return true;
        return false;
      }
      // Default text message: require 1..2000 chars
      return typeof value === 'string' && value.trim().length >= 1 && value.length <= 2000;
    })
    .withMessage('Invalid message content for the provided message type'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'system', 'contract', 'video_call'])
    .withMessage('Message type must be text, image, file, system, contract, or video_call'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('contractId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid contract ID is required'),
  body('jobApplicationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid job application ID is required')
];

// Agency profile validation
const validateAgencyProfile = [
  body('agencyName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Agency name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Phone must be a valid phone number'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  body('city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  body('country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),
  body('businessType')
    .optional()
    .isIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'other'])
    .withMessage('Invalid business type'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('teamSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Team size must be a positive integer'),
  body('yearsInBusiness')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years in business must be a non-negative integer')
];

// Job post validation
const validateJobPost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .optional()
    .isIn(['fixed', 'hourly', 'range'])
    .withMessage('Budget type must be fixed, hourly, or range'),
  body('minBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('maxBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'intermediate', 'expert'])
    .withMessage('Experience level must be entry, intermediate, or expert'),
  body('projectDuration')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Project duration must not exceed 100 characters'),
  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),
  body('maxApplications')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum applications must be between 1 and 1000'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date'),
  body('connectRequired')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Connect required must be between 0 and 100')
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required')
];

const validateContractId = [
  param('contractId')
    .isInt({ min: 1 })
    .withMessage('Valid contract ID is required')
];

const validateJobPostId = [
  param('jobPostId')
    .isInt({ min: 1 })
    .withMessage('Valid job post ID is required')
];

const validateApplicationId = [
  param('applicationId')
    .isInt({ min: 1 })
    .withMessage('Valid application ID is required')
];

const validateAgencyId = [
  param('agencyId')
    .isInt({ min: 1 })
    .withMessage('Valid agency ID is required')
];

const validateFreelancerId = [
  param('freelancerId')
    .isInt({ min: 1 })
    .withMessage('Valid freelancer ID is required')
];

const validateMessageId = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Valid message ID is required')
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),
  body('language')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Language must not exceed 10 characters'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean')
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateJobApplication,
  validateConnectPurchase,
  validateContractCreation,
  validateMessage,
  validateAgencyProfile,
  validateJobPost,
  validateId,
  validateContractId,
  validateJobPostId,
  validateApplicationId,
  validateAgencyId,
  validateFreelancerId,
  validateMessageId,
  validatePagination,
  validateSearch,
  validatePasswordReset,
  validateProfileUpdate,
  validateChangePassword,
};