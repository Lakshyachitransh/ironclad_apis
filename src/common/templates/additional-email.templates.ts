/**
 * Password Reset Email Template
 * Secure and professional design
 */
export const passwordResetEmailTemplate = (
  userName: string,
  resetLink: string,
  expirationHours: number = 24,
  supportEmail?: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
            padding: 20px 0;
        }
        .email-wrapper {
            background-color: #f7fafc;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #ed8936 0%, #f6ad55 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .intro-text {
            font-size: 15px;
            color: #5a6c7d;
            margin-bottom: 25px;
            line-height: 1.8;
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 10px;
            padding: 16px;
            margin: 25px 0;
            font-size: 14px;
            color: #92400e;
            line-height: 1.7;
        }
        .cta-section {
            margin: 35px 0;
            text-align: center;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ed8936 0%, #f6ad55 100%);
            color: white;
            padding: 16px 45px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 12px 28px rgba(237, 137, 54, 0.35);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 40px rgba(237, 137, 54, 0.45);
        }
        .link-fallback {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            word-break: break-all;
            color: #667eea;
            font-family: monospace;
        }
        .expiration-notice {
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 8px;
            padding: 14px;
            margin: 20px 0;
            font-size: 13px;
            color: #991b1b;
        }
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
        }
        @media (max-width: 600px) {
            .content, .header {
                padding: 25px 20px;
            }
            .cta-button {
                padding: 14px 35px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <h1>🔐 Reset Your Password</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hi ${userName},</p>
                
                <p class="intro-text">
                    We received a request to reset the password for your account. Click the button below to create a new password.
                </p>
                
                <div class="warning-box">
                    <strong>🔒 Security Note:</strong> For your protection, this link will expire in <strong>${expirationHours} hours</strong>. If you didn't request this, please ignore this email or contact support.
                </div>
                
                <div class="cta-section">
                    <a href="${resetLink}" class="cta-button">Reset Password</a>
                </div>
                
                <p style="text-align: center; color: #5a6c7d; font-size: 13px; margin-bottom: 15px;">or copy this link:</p>
                
                <div class="link-fallback">${resetLink}</div>
                
                <div class="expiration-notice">
                    ⏰ <strong>This link expires in ${expirationHours} hours</strong>. After that, you'll need to request a new password reset.
                </div>
                
                ${supportEmail ? `
                <p style="font-size: 14px; color: #5a6c7d; margin-top: 25px;">
                    Didn't request this? Contact us at <strong>${supportEmail}</strong>
                </p>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>This is an automated security email. Please do not reply.</p>
                <p style="margin-top: 15px; border-top: 1px solid #4a5568; padding-top: 15px;">
                    <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
                    <a href="#" style="color: #667eea; text-decoration: none;">Security</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Account Verified Email Template
 */
export const accountVerifiedEmailTemplate = (
  userName: string,
  tenantName: string,
  appUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verified</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
            padding: 20px 0;
        }
        .email-wrapper { background-color: #f7fafc; padding: 20px; }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .checkmark {
            font-size: 48px;
            margin-bottom: 15px;
            animation: scaleIn 0.5s ease;
        }
        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #2d3748; margin-bottom: 15px; font-weight: 600; }
        .message { font-size: 15px; color: #5a6c7d; margin-bottom: 25px; line-height: 1.8; }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 45px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 12px 28px rgba(16, 185, 129, 0.35);
            transition: all 0.3s ease;
            display: inline-block;
        }
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 40px rgba(16, 185, 129, 0.45);
        }
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>Account Verified!</h1>
            </div>
            <div class="content">
                <p class="greeting">Hi ${userName},</p>
                <p class="message">
                    Your account has been successfully verified. You can now access all features of ${tenantName}.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}" class="cta-button">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
