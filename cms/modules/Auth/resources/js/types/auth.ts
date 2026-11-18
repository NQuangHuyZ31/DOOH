export interface LoginPayload {
  email?: string;
  username_or_email: string;
  password: string;
  remember?: boolean;
}

export interface VerifyOtpPayload {
  temp_token: string;
  code: string;
}

export interface ResendOtpPayload {
  temp_token: string;
}

export interface ResendOtpResponse {
  step: 'email_otp';
  require_otp: boolean;
  temp_token: string;
  email: string;
  message?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  permission_type?: 'role' | 'direct';
  role?: string | null;
  roles?: string[];
  permissions?: string[];
  created_at?: string | null;
}

export interface AuthResponse {
  step: 'completed' | 'email_otp';
  require_otp?: boolean;
  temp_token?: string;
  email?: string;
  token?: string;
  token_type?: string;
  user?: AuthUser;
  message?: string;
}
