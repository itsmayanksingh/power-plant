export type UserRole = "superadmin" | "admin" | "employee";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  profileImage?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
