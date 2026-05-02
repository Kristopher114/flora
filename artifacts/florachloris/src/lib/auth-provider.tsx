import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout, getGetMeQueryKey, type LoginRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        if (data.user.role === "admin") setLocation("/admin/portal-select");
        else if (data.user.role === "cashier") setLocation("/cashier");
        else setLocation("/");
      },
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      },
    },
  });

  const handleLogin = async (data: LoginRequest) => {
    await loginMutation.mutateAsync({ data });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        isLoggingIn: loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
