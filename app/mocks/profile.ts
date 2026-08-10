import { delay } from "@/mocks/shared";
import type { UpdateProfileBody, User } from "@/types/profile";

let user: User = {
  id: "mock-user",
  name: "Amina El-Sayed",
  email: "amina.elsayed@example.com",
  phone: "+201001234567",
  employment_status: "employed",
  monthly_income: "42000.00",
  income_steadiness: "steady",
  has_password: true,
  email_verified: true,
};

export function getMe(): Promise<User> {
  return delay(user);
}

export function updateProfile(body: UpdateProfileBody): Promise<User> {
  user = { ...user, ...body };
  return delay(user);
}
