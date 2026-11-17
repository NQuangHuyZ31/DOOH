export interface LoginPayload {
  email?: string;
  username_or_email: string;
  password: string;
  remember?: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string;
}

export interface AuthResponse {
  step: 'completed' | 'email_otp';
  require_otp?: boolean;
  temp_token?: string;
  email?: string;
  token?: string;
  token_type?: string;
  user?: AuthUser;
  expires_in?: number;
}
