export type NotificationAudience = "everyone" | "account";

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
