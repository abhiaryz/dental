import nodemailer from "nodemailer";

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generic email interface
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Generic send email function
export async function sendEmail(options: SendEmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "noreply@aidcircle.in",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export interface InvitationEmailData {
  to: string;
  clinicName: string;
  clinicCode: string;
  role: string;
  invitedBy: string;
  invitationToken: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const roleNames: Record<string, string> = {
    CLINIC_DOCTOR: "Clinic Doctor",
    HYGIENIST: "Hygienist/Assistant",
    RECEPTIONIST: "Receptionist",
    ADMIN: "Admin",
  };

  const roleName = roleNames[data.role] || data.role;
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup/employee/${data.clinicCode}?token=${data.invitationToken}`;

  try {
    const emailResult = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "noreply@aidcircle.in",
      to: data.to,
      subject: `You've been invited to join ${data.clinicName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Clinic Invitation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DentaEdge</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">You're Invited! 🎉</h2>
              
              <p style="font-size: 16px;">Hi there,</p>
              
              <p style="font-size: 16px;">
                <strong>${data.invitedBy}</strong> has invited you to join <strong>${data.clinicName}</strong> as a <strong>${roleName}</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Clinic Code:</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #667eea; font-family: monospace; letter-spacing: 2px;">
                  ${data.clinicCode}
                </p>
              </div>
              
              <p style="font-size: 16px;">
                Click the button below to complete your registration and join the team:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Complete Registration
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                <strong>Note:</strong> This invitation will expire in 7 days.
              </p>
              
              <p style="font-size: 14px; color: #999; margin-top: 30px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 DentaEdge. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: emailResult };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

// Verify SMTP connection
export async function verifySmtpConnection() {
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error);
    return false;
  }
}

export interface PasswordResetEmailData {
  to: string;
  resetToken: string;
  userName?: string;
}

export interface EmailVerificationData {
  to: string;
  verificationToken: string;
  userName?: string;
}

export async function sendVerificationEmail(data: EmailVerificationData) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${data.verificationToken}`;

  try {
    const emailResult = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "noreply@aidcircle.in",
      to: data.to,
      subject: "Verify Your Email - DentaEdge",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DentaEdge</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">Verify Your Email 📧</h2>
              
              <p style="font-size: 16px;">
                ${data.userName ? `Hi ${data.userName},` : 'Hi there,'}
              </p>
              
              <p style="font-size: 16px;">
                Thanks for signing up! Please verify your email address to complete your registration and access your DentaEdge account.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ Important:</strong> This link will expire in 24 hours.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                <strong>Didn't sign up for DentaEdge?</strong><br>
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 DentaEdge. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: emailResult };
  } catch (error) {
    console.error("Verification email send error:", error);
    return { success: false, error };
  }
}

export interface WelcomeEmailData {
  to: string;
  userName: string;
  isClinic: boolean;
  clinicName?: string;
  clinicCode?: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    const emailResult = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "noreply@aidcircle.in",
      to: data.to,
      subject: `Welcome to DentaEdge${data.clinicName ? ` - ${data.clinicName}` : ''}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DentaEdge</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to DentaEdge!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">Hi ${data.userName}!</h2>
              
              <p style="font-size: 16px;">
                ${data.isClinic 
                  ? `Your clinic <strong>${data.clinicName}</strong> has been successfully set up!` 
                  : 'Your individual practice account is ready to go!'}
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #667eea;">🚀 Quick Start Guide</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li style="margin-bottom: 10px;">Add your first patient</li>
                  <li style="margin-bottom: 10px;">Schedule appointments</li>
                  <li style="margin-bottom: 10px;">Create treatment records</li>
                  <li style="margin-bottom: 10px;">Explore AI diagnosis assistant</li>
                  ${data.isClinic ? '<li style="margin-bottom: 10px;">Invite team members</li>' : ''}
                </ul>
              </div>
              
              ${data.clinicCode ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                  <strong>Your Clinic Code:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold;">${data.clinicCode}</span><br>
                  Share this with your team members so they can join your clinic.
                </p>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Go to Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                <strong>Need help?</strong> Our support team is here for you.<br>
                Reply to this email or visit our support center.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 DentaEdge. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: emailResult };
  } catch (error) {
    console.error("Welcome email send error:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`;

  try {
    const emailResult = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "noreply@aidcircle.in",
      to: data.to,
      subject: "Reset Your Password - DentaEdge",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DentaEdge</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">Reset Your Password</h2>
              
              <p style="font-size: 16px;">
                ${data.userName ? `Hi ${data.userName},` : 'Hi there,'}
              </p>
              
              <p style="font-size: 16px;">
                We received a request to reset your password for your DentaEdge account. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                <strong>Didn't request a password reset?</strong><br>
                If you didn't request this, you can safely ignore this email. Your password will not be changed.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 DentaEdge. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data: emailResult };
  } catch (error) {
    console.error("Password reset email send error:", error);
    return { success: false, error };
  }
}

