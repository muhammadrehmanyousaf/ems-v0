import axiosInstance from '@/lib/axiosConfig';

export async function getLoggedInUser(): Promise<any> {
  try {
    if (typeof window === 'undefined') return null;

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      console.error('Missing user ID in localStorage.');
      return null;
    }

    const response = await axiosInstance.get(`/api/v1/users/${userId}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
