import { createContext } from "react";
import type { User, LoginRequest } from "@workspace/api-client-react";

export interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
