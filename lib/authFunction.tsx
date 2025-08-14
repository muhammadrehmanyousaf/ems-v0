import axiosInstance from '@/lib/axiosConfig';

export async function getLoggedInUser(): Promise<any> {
  try {
    if (typeof window === 'undefined') return null;

    const userId = localStorage.getItem("user_id") || document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
    if (!userId) {
      console.error('Missing user ID in localStorage and cookies.');
      return null;
    }

    const response = await axiosInstance.get(`/api/v1/users/${userId}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
