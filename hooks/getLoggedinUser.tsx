import { useUser } from "@/context/UserContext";

export function getUser() {
  const { user, isAuthenticated, isLoading } = useUser();

  return {
    user,
    loading: isLoading,
    isAuthenticated,
  };
}
