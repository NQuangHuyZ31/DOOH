<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your DOOH Media Verification Code</title>
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
        }
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 30px;
        }
        .code-wrapper {
            background: #f8fafc;
            border: 2px dashed #0284c7;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin-bottom: 30px;
        }
        .code-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .otp-code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #0284c7;
            padding-left: 10px;
        }
        .expiry-note {
            font-size: 13px;
            color: #64748b;
            margin-top: 10px;
        }
        .notice-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 14px 16px;
            border-radius: 6px;
            font-size: 13px;
            color: #991b1b;
            line-height: 1.5;
            margin-bottom: 28px;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
        .footer p {
            margin: 4px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DOOH Media Platform</h1>
            <p>Security Verification</p>
        </div>
        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>
            <div class="message">
                A request was made to sign in to your DOOH Media account. Please use the verification code below to complete your authentication.
            </div>

            <div class="code-wrapper">
                <div class="code-label">One-Time Verification Code</div>
                <div class="otp-code">{{ $otpCode }}</div>
                <div class="expiry-note">This code will expire in <strong>{{ $ttlMinutes }} minutes</strong>.</div>
            </div>

            <div class="notice-box">
                <strong>Security Alert:</strong> If you did not initiate this sign-in attempt, please disregard this email or report it to your administrator immediately. Never share your verification code with anyone.
            </div>

            <div style="font-size: 14px; color: #64748b; line-height: 1.5;">
                Best regards,<br>
                <strong>DOOH Media Security Team</strong>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} DOOH Media Management Platform. All rights reserved.</p>
            <p>Automated security notification &bull; Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
