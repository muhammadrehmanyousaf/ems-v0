import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/lib/authFunction";

export function getUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getLoggedInUser();
        setUser(userData.data);
      } catch (err) {
        setError("Failed to fetch user data.");
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}
