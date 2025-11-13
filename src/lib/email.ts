import nodemailer from 'nodemailer';
import prisma from './prisma';

// Email configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '', // SMTP username
    pass: process.env.SMTP_PASS || '', // SMTP password or app password
  },
  from: process.env.SMTP_FROM || '"App Review Analyzer" <noreply@appreviewanalyzer.com>',
};

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport(SMTP_CONFIG);
};

// Email templates
export const emailTemplates = {
  analysisCompleted: (appName: string, analysisUrl: string) => ({
    subject: `Analysis Complete: ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Analysis Complete</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .stats { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Analysis Complete!</h1>
            <p>Your app review analysis is ready</p>
          </div>

          <div class="content">
            <h2>Hello,</h2>
            <p>Great news! We've completed the analysis for <strong>${appName}</strong>. Your comprehensive review report is now available.</p>

            <div style="text-align: center;">
              <a href="${analysisUrl}" class="cta-button">View Your Analysis</a>
            </div>

            <div class="stats">
              <h3>What's included in your report:</h3>
              <ul style="list-style: none; padding: 0;">
                <li>📊 Sentiment analysis of user reviews</li>
                <li>🔍 Critical issues identified by users</li>
                <li>💡 Feature requests and improvement suggestions</li>
                <li>📈 Actionable insights for app improvement</li>
                <li>📋 Priority recommendations</li>
              </ul>
            </div>

            <p>Thank you for using App Review Analyzer to understand your users better!</p>

            <div class="footer">
              <p>Best regards,<br>The App Review Analyzer Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                If you didn't request this analysis, please ignore this email or contact our support.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  analysisFailed: (appName: string, errorMessage?: string) => ({
    subject: `Analysis Failed: ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Analysis Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Analysis Failed</h1>
            <p>We encountered an issue with your analysis</p>
          </div>

          <div class="content">
            <h2>Hello,</h2>
            <p>Unfortunately, we encountered an issue while analyzing <strong>${appName}</strong>. The analysis process failed to complete.</p>

            <div class="error-box">
              <h3>What happened?</h3>
              <p>This could be due to:</p>
              <ul>
                <li>App store availability issues</li>
                <li>Network connectivity problems</li>
                <li>Temporary service maintenance</li>
                <li>App data access restrictions</li>
              </ul>
              ${errorMessage ? `<p><strong>Error details:</strong> ${errorMessage}</p>` : ''}
            </div>

            <div style="text-align: center;">
              <a href="/" class="cta-button">Try Again</a>
            </div>

            <p>Our team has been notified of this issue and will work to resolve it. You can try running the analysis again in a few minutes.</p>

            <div class="footer">
              <p>We apologize for the inconvenience,<br>The App Review Analyzer Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Need help? Contact us at support@appreviewanalyzer.com
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  welcomeEmail: (userName: string) => ({
    subject: 'Welcome to App Review Analyzer! 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to App Review Analyzer</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .feature { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to App Review Analyzer! 🎉</h1>
            <p>Your journey to better app insights starts here</p>
          </div>

          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome aboard! We're excited to help you understand your app's user reviews like never before.</p>

            <div style="text-align: center;">
              <a href="/" class="cta-button">Start Your First Analysis</a>
            </div>

            <h3>What can you do with App Review Analyzer?</h3>
            <div class="feature-grid">
              <div class="feature">
                <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
                <h4>Comprehensive Analysis</h4>
                <p>Analyze thousands of reviews in minutes</p>
              </div>
              <div class="feature">
                <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
                <h4>Smart Insights</h4>
                <p>Get actionable recommendations for improvement</p>
              </div>
              <div class="feature">
                <div style="font-size: 24px; margin-bottom: 10px;">💡</div>
                <h4>Feature Requests</h4>
                <p>Discover what users want most</p>
              </div>
              <div class="feature">
                <div style="font-size: 24px; margin-bottom: 10px;">📈</div>
                <h4>Sentiment Tracking</h4>
                <p>Understand user emotions and trends</p>
              </div>
            </div>

            <h3>Getting Started is Easy:</h3>
            <ol style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <li>Paste any App Store or Google Play URL</li>
              <li>Let our AI analyze the reviews</li>
              <li>Get your comprehensive report instantly</li>
            </ol>

            <div class="footer">
              <p>Need help getting started?<br>Check out our <a href="/help" style="color: #4f46e5;">Help Center</a> or reply to this email!</p>
              <p>Happy analyzing,<br>The App Review Analyzer Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionActivated: (tier: string, nextBillingDate?: string) => ({
    subject: `Subscription Activated: ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Activated</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .benefits { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Subscription Activated!</h1>
            <p>Welcome to the ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</p>
          </div>

          <div class="content">
            <h2>Congratulations!</h2>
            <p>Your subscription has been successfully activated. You now have access to premium features that will help you get the most out of your app review analysis.</p>

            <div style="text-align: center;">
              <a href="/dashboard" class="cta-button">Go to Dashboard</a>
            </div>

            <div class="benefits">
              <h3>Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan includes:</h3>
              ${tier === 'professional' ? `
                <ul style="list-style: none; padding: 0;">
                  <li>✅ Unlimited app analyses</li>
                  <li>✅ Advanced AI insights</li>
                  <li>✅ Up to 2000 reviews per analysis</li>
                  <li>✅ Priority processing</li>
                  <li>✅ Export reports (PDF, CSV, JSON)</li>
                </ul>
              ` : tier === 'team' ? `
                <ul style="list-style: none; padding: 0;">
                  <li>✅ All Professional features</li>
                  <li>✅ Multi-user collaboration</li>
                  <li>✅ Up to 5000 reviews per analysis</li>
                  <li>✅ API access</li>
                  <li>✅ Priority support</li>
                </ul>
              ` : ''}
              ${nextBillingDate ? `<p><strong>Next billing date:</strong> ${new Date(nextBillingDate).toLocaleDateString()}</p>` : ''}
            </div>

            <p>Start exploring your new features and take your app analysis to the next level!</p>

            <div class="footer">
              <p>Thank you for choosing App Review Analyzer,<br>The Team</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Need help? Contact us at support@appreviewanalyzer.com
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
export const sendEmail = async (
  to: string | string[],
  template: { subject: string; html: string },
  attachments?: Array<{ filename: string; content: Buffer | string }>
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: SMTP_CONFIG.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: template.subject,
      html: template.html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Specific notification functions
export const notifyAnalysisCompleted = async (userId: string, appName: string, appSlug: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (!user || !user.emailNotifications) {
      return { skipped: true, reason: 'Email notifications disabled' };
    }

    const analysisUrl = `${process.env.NEXTAUTH_URL}/app/${appSlug}`;
    const template = emailTemplates.analysisCompleted(appName, analysisUrl);

    await sendEmail(user.email, template);

    // Log the notification
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: 'analysis_completed',
        metadata: {
          type: 'analysis_completed',
          appName,
          appSlug,
          email: user.email,
        },
      },
    });

    return { success: true, email: user.email };
  } catch (error) {
    console.error('Error notifying analysis completed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const notifyAnalysisFailed = async (userId: string, appName: string, error?: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (!user || !user.emailNotifications) {
      return { skipped: true, reason: 'Email notifications disabled' };
    }

    const template = emailTemplates.analysisFailed(appName, error);

    await sendEmail(user.email, template);

    // Log the notification
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: 'analysis_completed',
        metadata: {
          type: 'analysis_failed',
          appName,
          error,
          email: user.email,
        },
      },
    });

    return { success: true, email: user.email };
  } catch (error) {
    console.error('Error notifying analysis failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  try {
    const template = emailTemplates.welcomeEmail(userName);

    await sendEmail(userEmail, template);

    // Find user and log the notification
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (user) {
      await prisma.usageLog.create({
        data: {
          userId: user.id,
          actionType: 'analysis_completed',
          metadata: {
            type: 'welcome',
            email: userEmail,
            name: userName,
          },
        },
      });
    }

    return { success: true, email: userEmail };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const notifySubscriptionActivated = async (userId: string, tier: string, nextBillingDate?: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (!user || !user.emailNotifications) {
      return { skipped: true, reason: 'Email notifications disabled' };
    }

    const template = emailTemplates.subscriptionActivated(tier, nextBillingDate);

    await sendEmail(user.email, template);

    // Log the notification
    await prisma.usageLog.create({
      data: {
        userId,
        actionType: 'analysis_completed',
        metadata: {
          type: 'subscription_activated',
          tier,
          nextBillingDate,
          email: user.email,
        },
      },
    });

    return { success: true, email: user.email };
  } catch (error) {
    console.error('Error notifying subscription activated:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export default {
  sendEmail,
  notifyAnalysisCompleted,
  notifyAnalysisFailed,
  sendWelcomeEmail,
  notifySubscriptionActivated,
  testEmailConfig,
  emailTemplates,
};