import axiosInstance from '@/lib/axiosConfig';

export async function getLoggedInUser(): Promise<any> {
  try {
    if (typeof window === 'undefined') return null;

    const userId = localStorage.getItem("user_id") || document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
    if (!userId) {
      console.error('Missing user ID in localStorage and cookies.');
      return null;
    }

    // Use the self-service endpoint. GET /users/:id is locked to super-admin
    // (it can read ANY user), so a vendor/customer fetching their own record
    // through it gets a 403 on every page. /users/profile/me returns the
    // caller's own record and is open to the owner.
    const response = await axiosInstance.get('/api/v1/users/profile/me');

    // /users/profile/me returns { data: { user, token } }; callers expect the
    // user object on `.data`. Remap so the existing contract is preserved.
    const u = response.data?.data?.user ?? response.data?.data ?? null;
    return { ...response.data, data: u };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
