export interface LoginPayload {
  username_or_email: string;
  password: string;
  remember?: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  expires_in?: number;
}
