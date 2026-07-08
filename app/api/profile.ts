import { apiClient } from "@/api/client";
import type { UpdateProfileBody, User } from "@/types/profile";

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>("/users/me");
  return res.data;
}

export async function updateProfile(body: UpdateProfileBody): Promise<User> {
  const res = await apiClient.patch<User>("/users/me", body);
  return res.data;
}
