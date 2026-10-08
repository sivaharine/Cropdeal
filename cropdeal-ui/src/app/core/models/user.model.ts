export type UserRole = 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN';

export interface User {
  id?: string;
  userId?: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  address?: string;
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  isBlocked?: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
  email?: string;
}

export interface RegisterRequest {
  name?: string;
  username: string;
  password?: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  address?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  newPassword?: string;
}
