import { ROUTING_CONFIG } from '../configs/routing';

export function getAuthToken(): string | null {
  return localStorage.getItem(ROUTING_CONFIG.auth.tokenKey);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(ROUTING_CONFIG.auth.tokenKey, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
}
