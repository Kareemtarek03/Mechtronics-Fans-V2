import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendPasswordResetEmail = async (email, verificationCode, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Verification Code - FanSelect Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1f3a 0%, #16213e 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">FanSelect Pro</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Verification Code</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${firstName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password. Use the verification code below to proceed:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #0ea5e9; color: white; padding: 20px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ${verificationCode}
            </div>
          </div>
          <p style="color: #666; line-height: 1.6; text-align: center;">
            Enter this code in the password reset form on our website.
          </p>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This code will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            For security reasons, never share this code with anyone.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to FanSelect Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1f3a 0%, #16213e 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">FanSelect Pro</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Welcome to FanSelect Pro!</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${firstName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your account has been successfully created. You can now log in and start selecting the best fans for your projects.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Go to Login
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
