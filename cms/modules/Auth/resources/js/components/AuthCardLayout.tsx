import React from 'react';
import { Card } from 'antd';
import { AUTH_PAGE_WRAPPER_STYLE, AUTH_CARD_STYLE } from '../configs/authConfig';
import { LoginHeroBanner } from './LoginHeroBanner';
import { LoginHeaderBadge } from './LoginHeaderBadge';

export interface AuthCardLayoutProps {
	otpMode?: boolean;
	mode?: 'login' | 'otp' | 'reset-password';
	error: string | null;
	onCloseError: () => void;
	children: React.ReactNode;
}

export const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ otpMode = false, mode = 'login', error, onCloseError, children }) => {
	return (
		<div style={AUTH_PAGE_WRAPPER_STYLE}>
			<Card style={AUTH_CARD_STYLE} styles={{ body: { padding: 0 } }}>
				<div style={{ display: 'flex', minHeight: 560 }}>
					<div style={{ width: '48%', display: 'flex' }}>
						<LoginHeroBanner />
					</div>
					<div
						style={{
							flex: 1,
							padding: '40px 36px',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							background: '#ffffff',
						}}
					>
						<LoginHeaderBadge otpMode={otpMode} mode={mode} error={error} onCloseError={onCloseError} />
						{children}
					</div>
				</div>
			</Card>
		</div>
	);
};

export default AuthCardLayout;
