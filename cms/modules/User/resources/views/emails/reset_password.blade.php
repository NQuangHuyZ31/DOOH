<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your DOOH Media Account Password</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #0b1120 0%, #1e293b 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 6px 0 0;
            color: #38bdf8;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            color: #334155;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 30px;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn-reset {
            display: inline-block;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 8px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
        }
        .expiry-note {
            font-size: 13px;
            color: #64748b;
            text-align: center;
            margin-top: 12px;
        }
        .link-fallback {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            font-size: 12px;
            color: #64748b;
            word-break: break-all;
            margin: 24px 0;
        }
        .notice-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 14px 16px;
            border-radius: 6px;
            font-size: 13px;
            color: #991b1b;
            line-height: 1.5;
            margin-top: 24px;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DOOH Media CMS</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="content">
            <div class="greeting">Hello {{ $userName }},</div>
            <div class="message">
                An administrator has requested a password reset for your account on the <strong>DOOH Media CMS</strong> platform. Click the button below to choose a new password.
            </div>

            <div class="btn-wrapper">
                <a href="{{ $resetUrl }}" class="btn-reset" target="_blank" rel="noopener noreferrer">
                    Reset Password
                </a>
                <div class="expiry-note">
                    This link is valid for <strong>{{ $ttlMinutes }} minutes</strong>.
                </div>
            </div>

            <div class="link-fallback">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="{{ $resetUrl }}" style="color: #0284c7;">{{ $resetUrl }}</a>
            </div>

            <div class="notice-box">
                <strong>Security Alert:</strong> If you did not request this password reset or believe this was triggered in error, please contact your system administrator immediately.
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} DOOH Media CMS Platform. All rights reserved.
        </div>
    </div>
</body>
</html>
