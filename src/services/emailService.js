const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // If email credentials are not set, return a mock transporter for dev
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  EMAIL_USER and EMAIL_PASS not configured - emails will be logged to console');
      return this.createMockTransporter();
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Wrap sendMail to handle auth errors gracefully
      const originalSendMail = transporter.sendMail.bind(transporter);
      transporter.sendMail = async (mailOptions) => {
        try {
          return await originalSendMail(mailOptions);
        } catch (error) {
          if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.error('❌ Gmail Authentication Failed!');
            console.error('📝 Gmail requires an App Password, not your regular password.');
            console.error('🔗 Generate one at: https://myaccount.google.com/apppasswords');
            console.warn('⚠️  Falling back to console logging for OTPs...\n');
            // Fall back to console logging
            const mockTransporter = this.createMockTransporter();
            return await mockTransporter.sendMail(mailOptions);
          }
          throw error;
        }
      };

      return transporter;
    } catch (error) {
      console.error('⚠️  Failed to create email transporter, falling back to console logging');
      return this.createMockTransporter();
    }
  }

  createMockTransporter() {
    return {
      sendMail: async (mailOptions) => {
        console.log('\n📧 [DEV MODE] Email would be sent:');
        console.log('   To:', mailOptions.to);
        console.log('   Subject:', mailOptions.subject);
        // Extract OTP from HTML if present
        const otpMatch = mailOptions.html?.match(/>\s*(\d{6})\s*</);
        if (otpMatch) {
          console.log('   🔑 OTP CODE:', otpMatch[1]);
          console.log('   ⚡ Copy this code to verify your email/login\n');
        }
        return { messageId: 'dev-mode-' + Date.now() };
      },
      verify: async () => true
    };
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP for email verification
  async sendVerificationOTP(email, otp, firstName = 'User') {
    const mailOptions = {
      from: {
        name: 'WorkLab',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email Address - WorkLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">WorkLab</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Freelance Marketplace</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Welcome to WorkLab! To complete your registration and start your freelance journey, 
              please verify your email address using the OTP below:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your Verification Code</h3>
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              <strong>⏰ This code expires in 10 minutes</strong>
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with WorkLab, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by WorkLab. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Send OTP for password reset
  async sendPasswordResetOTP(email, otp, firstName = 'User') {
    const mailOptions = {
      from: {
        name: 'WorkLab',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Code - WorkLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">WorkLab</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 🔐</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Use the OTP below to verify your identity 
              and create a new password:
            </p>
            
            <div style="background: white; border: 2px dashed #dc3545; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your Reset Code</h3>
              <div style="background: #dc3545; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              <strong>⏰ This code expires in 10 minutes</strong>
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email. Your account remains secure.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by WorkLab. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Send OTP for passwordless login
  async sendLoginOTP(email, otp, firstName = 'User') {
    const mailOptions = {
      from: {
        name: 'WorkLab',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Your WorkLab Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">WorkLab</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">One-Time Login Code</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 🔑</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the code below to sign in to your WorkLab account:</p>
            <div style="background: white; border: 2px dashed #4facfe; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your Login Code</h3>
              <div style="background: #4facfe; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px; margin: 20px 0;"><strong>⏰ This code expires in 10 minutes</strong></p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email, firstName, userType) {
    const mailOptions = {
      from: {
        name: 'WorkLab',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to WorkLab! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to WorkLab! 🎉</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your account is now verified</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Congratulations! Your email has been verified and your WorkLab account is now active. 
              You're ready to start your freelance journey!
            </p>
            
            <div style="background: white; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #28a745; margin: 0 0 10px 0; font-size: 18px;">🎁 Welcome Bonus!</h3>
              <p style="color: #333; font-size: 24px; font-weight: bold; margin: 0;">
                20 Free Connects
              </p>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                Use these connects to apply for jobs and start earning!
              </p>
            </div>
            
            <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8;">
                ${userType === 'freelancer' ? `
                  <li>Complete your freelancer profile</li>
                  <li>Browse available jobs</li>
                  <li>Apply to jobs that interest you</li>
                  <li>Start building your reputation</li>
                ` : `
                  <li>Complete your client profile</li>
                  <li>Post your first job</li>
                  <li>Find talented freelancers</li>
                  <li>Start your project</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Get Started Now
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by WorkLab. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Test email configuration
  async testEmailConfig() {
    try {
      await this.transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
