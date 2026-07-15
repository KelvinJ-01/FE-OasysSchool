export type NotificationType = 'attendance' | 'system' | 'account';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationsResponse {
  items: AppNotification[];
  totalCount: number;
  unreadCount: number;
}
