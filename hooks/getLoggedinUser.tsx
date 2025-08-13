import { useUser } from "@/context/UserContext";

export function getUser() {
  const { user, isAuthenticated, isLoading, error } = useUser();
  
  return { 
    user, 
    loading: isLoading, 
    error: error || null,
    isAuthenticated 
  };
}
