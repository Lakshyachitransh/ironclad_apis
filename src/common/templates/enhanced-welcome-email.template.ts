/**
 * World-Class Welcome Email Template
 * Premium design with brand integration, security info, and next steps
 */
export const enhancedWelcomeEmailTemplate = (
  userName: string,
  email: string,
  tempPassword: string,
  tenantName: string,
  loginUrl: string,
  supportEmail?: string,
  features?: string[]
): string => {
  const defaultFeatures = [
    'Interactive course assignments',
    'Real-time progress tracking',
    'Live class sessions',
    'Quiz & assessments',
    'Certificate generation',
    'Collaborative learning'
  ];

  const featuresToShow = features || defaultFeatures;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Welcome to ${tenantName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
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
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 50px 30px;
            text-align: center;
            color: white;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"></path></svg>');
            background-size: cover;
            opacity: 0.5;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
            letter-spacing: 0.3px;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 26px;
            color: #2d3748;
            margin-bottom: 12px;
            font-weight: 700;
        }
        
        .intro-text {
            font-size: 15px;
            color: #5a6c7d;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        
        /* Welcome Badge */
        .welcome-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 25px;
            letter-spacing: 0.5px;
        }
        
        /* Credentials Section */
        .credentials-section {
            margin: 35px 0;
        }
        
        .section-title {
            font-size: 14px;
            color: #667eea;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .credentials-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #eef2f7 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .credential-item {
            margin-bottom: 15px;
        }
        
        .credential-item:last-child {
            margin-bottom: 0;
        }
        
        .credential-label {
            color: #667eea;
            font-weight: 700;
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .credential-value {
            color: #2d3748;
            background: white;
            padding: 12px 14px;
            border-radius: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            word-break: break-all;
            border: 1px solid #cbd5e0;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* CTA Section */
        .cta-section {
            margin: 40px 0;
            text-align: center;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 45px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 12px 28px rgba(102, 126, 234, 0.35);
            border: none;
            cursor: pointer;
            letter-spacing: 0.3px;
        }
        
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 40px rgba(102, 126, 234, 0.45);
        }
        
        /* Instructions */
        .instructions-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            border: 1px solid #c5cae9;
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
        }
        
        .instructions-box h4 {
            color: #1976d2;
            margin-bottom: 16px;
            font-size: 15px;
            font-weight: 700;
        }
        
        .instructions-box ol {
            margin-left: 20px;
            color: #2d3748;
            font-size: 14px;
            line-height: 1.9;
        }
        
        .instructions-box li {
            margin-bottom: 10px;
        }
        
        .instructions-box li strong {
            color: #667eea;
            font-weight: 700;
        }
        
        /* Features Section */
        .features-section {
            margin: 35px 0;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 15px;
        }
        
        .feature-item {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            text-align: center;
            font-size: 13px;
            color: #2d3748;
            font-weight: 500;
        }
        
        .feature-item::before {
            content: '✓';
            color: #667eea;
            font-weight: 700;
            display: block;
            font-size: 18px;
            margin-bottom: 6px;
        }
        
        /* Security Info */
        .security-info {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 10px;
            padding: 16px;
            margin: 30px 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.7;
        }
        
        .security-info strong {
            color: #92400e;
            font-weight: 700;
        }
        
        .security-icon {
            font-size: 18px;
            margin-right: 8px;
        }
        
        /* Support Section */
        .support-section {
            background: #f8f9fa;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 24px 0;
            margin: 30px 0;
            text-align: center;
        }
        
        .support-section p {
            font-size: 14px;
            color: #5a6c7d;
            margin-bottom: 10px;
        }
        
        .support-email {
            color: #667eea;
            font-weight: 700;
            text-decoration: none;
        }
        
        /* Footer */
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
        }
        
        .footer p {
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .divider {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 25px 0;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                border-radius: 8px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 25px 20px;
            }
            
            .greeting {
                font-size: 22px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
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
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <h1>🎉 Welcome Aboard!</h1>
                    <p>Your account is ready to go</p>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <div class="welcome-badge">✨ New Member</div>
                
                <h2 class="greeting">Hi ${userName},</h2>
                
                <p class="intro-text">
                    We're thrilled to have you join <strong>${tenantName}</strong>! Your account has been successfully created and is ready for immediate use. This email contains all the information you need to get started.
                </p>
                
                <!-- Credentials -->
                <div class="credentials-section">
                    <h3 class="section-title">📝 Your Login Credentials</h3>
                    <div class="credentials-box">
                        <div class="credential-item">
                            <span class="credential-label">📧 Email Address</span>
                            <div class="credential-value">${email}</div>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">🔐 Temporary Password</span>
                            <div class="credential-value">${tempPassword}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Security Info -->
                <div class="security-info">
                    <strong><span class="security-icon">🔒</span>Security Reminder:</strong> Your temporary password will expire after your first login. Please change it to a strong, unique password immediately for your account security.
                </div>
                
                <!-- CTA Button -->
                <div class="cta-section">
                    <a href="${loginUrl}" class="cta-button">Sign In to ${tenantName}</a>
                </div>
                
                <!-- Getting Started Instructions -->
                <div class="instructions-box">
                    <h4>🚀 Getting Started in 3 Steps</h4>
                    <ol>
                        <li>Click the "Sign In" button above or visit <strong>${loginUrl}</strong></li>
                        <li>Log in with your email and temporary password</li>
                        <li>Change your password to something secure when prompted</li>
                    </ol>
                </div>
                
                <!-- Features -->
                <div class="features-section">
                    <h3 class="section-title">✨ What You Can Do</h3>
                    <div class="features-grid">
                        ${featuresToShow.map(feature => `<div class="feature-item">${feature}</div>`).join('')}
                    </div>
                </div>
                
                <!-- Support -->
                <div class="support-section">
                    <p><strong>Need Help?</strong></p>
                    <p>
                        If you have any questions or encounter any issues, 
                        ${supportEmail ? `please contact us at <a href="mailto:${supportEmail}" class="support-email">${supportEmail}</a>` : 'please reach out to your administrator'}
                    </p>
                </div>
                
                <hr class="divider">
                
                <!-- Additional Info -->
                <p style="font-size: 13px; color: #5a6c7d; text-align: center; margin-top: 20px;">
                    <strong>Pro Tip:</strong> Bookmark the login page or save this email for easy access to your login URL and credentials.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>🏢 <strong>${tenantName}</strong> | Learning & Development Platform</p>
                <p>This email was sent to <strong>${email}</strong> as part of your account setup.</p>
                <p style="margin-top: 15px; border-top: 1px solid #4a5568; padding-top: 15px;">
                    This is an automated message. Please do not reply to this email. <br>
                    <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
