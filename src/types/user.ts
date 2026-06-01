export type UserRole = 'Super Admin' | 'Admin' | 'Student'
export type UserStatus = 'Active' | 'Inactive' | 'Locked'

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserRequest {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}