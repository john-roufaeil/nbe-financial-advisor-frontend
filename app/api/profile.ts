import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { UpdateProfileBody, User } from "@/types/profile";

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(API_ENDPOINTS.usersMe);
  return res.data;
}

export async function updateProfile(body: UpdateProfileBody): Promise<User> {
  const res = await apiClient.patch<User>(API_ENDPOINTS.usersMe, body);
  return res.data;
}
