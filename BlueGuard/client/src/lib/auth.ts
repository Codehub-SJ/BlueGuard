import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "community" | "authority";
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: "community" | "authority";
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser }> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  async register(data: RegisterData): Promise<{ user: AuthUser }> {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },

  async logout(): Promise<void> {
    // Clear local storage and any auth tokens
    localStorage.removeItem("blueguard_user");
  },
};
