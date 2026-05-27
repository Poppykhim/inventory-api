import api from './api'

export interface RegisterPayload {
  username: string
  email: string
  password: string
  role?: 'admin' | 'user'
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
}

export const authService = {
  register(data: RegisterPayload) {
    return api.post<AuthResponse>('/auth/register', data)
  },
  login(data: LoginPayload) {
    return api.post<AuthResponse>('/auth/login', data)
  },
  getProfile() {
    return api.get<UserProfile>('/auth/profile')
  },
}
