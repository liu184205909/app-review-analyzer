import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';
import prisma from '@/lib/prisma';

// POST /api/user/test-email - Send test email
export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.emailNotifications) {
      return NextResponse.json(
        { error: 'Email notifications are disabled' },
        { status: 400 }
      );
    }

    // Create test email template
    const testEmailTemplate = {
      subject: 'Test Email from App Review Analyzer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .status { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Test Email</h1>
              <p>Your email settings are working correctly!</p>
            </div>

            <div class="content">
              <h2>Hello ${user.name || 'User'},</h2>
              <p>This is a test email to confirm that your email notifications are properly configured.</p>

              <div class="status">
                <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
                <h3>Email Configuration Verified</h3>
                <p>Your email address (<strong>${user.email}</strong>) is working correctly.</p>
              </div>

              <h3>What does this mean?</h3>
              <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <li>✅ You'll receive analysis completion notifications</li>
                <li>✅ You'll get important security alerts</li>
                <li>✅ You'll receive subscription updates</li>
                <li>✅ Email delivery is working properly</li>
              </ul>

              <div class="footer">
                <p>This confirms that your email notification settings are working as expected.</p>
                <p>Best regards,<br>The App Review Analyzer Team</p>
                <p style="font-size: 12px; margin-top: 10px;">
                  If you didn't request this test email, you can safely ignore it.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send test email
    await sendEmail(user.email, testEmailTemplate);

    // Log the test email
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'email_sent',
        metadata: {
          type: 'test_email',
          email: user.email,
        },
      },
    });

    return NextResponse.json({
      message: 'Test email sent successfully',
      email: user.email,
    });

  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}