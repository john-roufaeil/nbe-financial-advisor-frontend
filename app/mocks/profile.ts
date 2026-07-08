import { delay } from "@/mocks/shared";
import type { UpdateProfileBody, User } from "@/types/profile";

let user: User = {
  id: "mock-user",
  name: "Amina El-Sayed",
  email: "amina.elsayed@example.com",
};

export function getMe(): Promise<User> {
  return delay(user);
}

export function updateProfile(body: UpdateProfileBody): Promise<User> {
  user = { ...user, ...body };
  return delay(user);
}
