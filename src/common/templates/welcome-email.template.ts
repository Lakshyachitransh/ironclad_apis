export const welcomeEmailTemplate = (userName: string, email: string, tempPassword: string, tenantName: string, loginUrl: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${tenantName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 300;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .intro-text {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .credentials-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .credentials-box h3 {
            color: #333;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .credential-item {
            margin-bottom: 15px;
            font-size: 15px;
        }
        .credential-label {
            color: #667eea;
            font-weight: 600;
            display: block;
            margin-bottom: 5px;
        }
        .credential-value {
            color: #333;
            background: white;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            border: 1px solid #e0e0e0;
        }
        .cta-section {
            margin: 40px 0;
            text-align: center;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }
        .instructions {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            border-left: 4px solid #2196f3;
        }
        .instructions h4 {
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }
        .instructions ol {
            margin-left: 20px;
            color: #333;
            font-size: 15px;
            line-height: 1.8;
        }
        .instructions li {
            margin-bottom: 10px;
        }
        .features {
            margin: 30px 0;
        }
        .features h4 {
            color: #333;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .feature-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .feature-item {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            color: #555;
            display: flex;
            align-items: center;
        }
        .feature-item::before {
            content: "✓";
            color: #667eea;
            font-weight: 700;
            margin-right: 10px;
            font-size: 18px;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            font-size: 14px;
            color: #999;
            margin-bottom: 10px;
        }
        .footer-links {
            font-size: 13px;
            color: #999;
        }
        .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .support-text {
            margin: 20px 0;
            padding: 15px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🎉 Welcome!</h1>
            <p>You're all set to get started with ${tenantName}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello ${userName},</div>

            <p class="intro-text">
                We're thrilled to have you join <strong>${tenantName}</strong>! Your account has been successfully created, and you're now ready to access all our platform features.
            </p>

            <!-- Credentials -->
            <div class="credentials-box">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-item">
                    <span class="credential-label">Email Address:</span>
                    <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Temporary Password:</span>
                    <div class="credential-value">${tempPassword}</div>
                </div>
            </div>

            <!-- Instructions -->
            <div class="instructions">
                <h4>📋 Getting Started:</h4>
                <ol>
                    <li>Click the "Sign In" button below to access your account</li>
                    <li>Use the credentials provided above to log in</li>
                    <li>Change your password immediately after your first login for security</li>
                    <li>Complete your profile to get the most out of the platform</li>
                </ol>
            </div>

            <!-- CTA Button -->
            <div class="cta-section">
                <a href="${loginUrl}" class="cta-button">Sign In to Your Account</a>
            </div>

            <!-- Features -->
            <div class="features">
                <h4>✨ What You Can Do:</h4>
                <div class="feature-list">
                    <div class="feature-item">Access Courses & Training</div>
                    <div class="feature-item">Track Progress</div>
                    <div class="feature-item">Take Quizzes</div>
                    <div class="feature-item">Join Live Classes</div>
                    <div class="feature-item">View Reports</div>
                    <div class="feature-item">Get Certificates</div>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Support -->
            <div class="support-text">
                <strong>⚠️ Important:</strong> This is a temporary password. For your account security, please change it immediately after your first login. Never share your credentials with anyone.
            </div>

            <p class="intro-text">
                If you have any questions or need assistance getting started, don't hesitate to reach out to our support team. We're here to help!
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>${tenantName}</strong></p>
            <p>Welcome to our learning platform</p>
            <div class="footer-links">
                <a href="https://help.example.com">Help Center</a> |
                <a href="https://docs.example.com">Documentation</a> |
                <a href="https://support.example.com">Support</a>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #ccc;">
                © 2025 ${tenantName}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};
