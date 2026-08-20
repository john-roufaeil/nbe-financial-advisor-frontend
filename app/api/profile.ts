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

/** Permanently deletes the current user's account — cascades to every
 * domain row (accounts, transactions, budgets, conversations, statements,
 * ...) server-side (core/views/profile.py's MeView.delete). Irreversible. */
export async function deleteMe(): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.usersMe);
}

/** Kicks off an async export of every piece of the user's own data,
 * emailed as a JSON attachment once ready (core/tasks/data_export.py) —
 * this call itself only enqueues the job (202), it doesn't wait for it. */
export async function requestDataExport(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.usersMeDataExport);
}
