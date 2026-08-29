import { ref } from 'vue';
import { defineStore } from 'pinia';
import { connectSignalR } from '@/socket/signalr';
import {
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead
} from '@/api/notification';
import { useToastStore } from '@/stores/toast';
import { getToken } from '@/utils/auth';

/** SignalR 推送的站内通知负载（与后端 NotificationDto 对应） */
export interface NotificationPayload {
  notifyGuid: string;
  type: string;
  title: string;
  content: string;
  refType?: string | null;
  refGuid?: string | null;
  isRead: boolean;
  createTime: string;
}

/** 模块级标志：PushNotification 监听只注册一次（SignalR 连接为单例） */
let listenerRegistered = false;

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0);
  const toast = useToastStore();

  /** 从 /api/notifications/unread-count 拉取未读数（页面刷新/后台校准用） */
  async function refreshUnreadCount(): Promise<void> {
    try {
      const { data } = await getNotificationUnreadCount();
      unreadCount.value = Number(data?.data ?? 0);
    } catch {
      // 网络失败静默，保持本地乐观值
    }
  }

  /**
   * 初始化通知通道：建立 /MessageHub 长连接并订阅 PushNotification，
   * 收到实时通知后未读数乐观 +1 并弹出提示（Markdown 点赞/投币/评论等通知）
   */
  async function initNotifications(): Promise<void> {
    if (!getToken()) return;

    await refreshUnreadCount();

    try {
      const conn = await connectSignalR();
      if (!listenerRegistered) {
        listenerRegistered = true;
        conn.on('PushNotification', (notification: NotificationPayload) => {
          if (!notification || !notification.title) return;
          unreadCount.value += 1;
          toast.push({ title: notification.title, text: notification.content, type: 'info' });
        });
      }
    } catch {
      // SignalR 连接失败：读侧拉取兜底，进入聊天页时会自动重连
    }
  }

  /** 全部已读 */
  async function markAllRead(): Promise<void> {
    await markAllNotificationsRead();
    unreadCount.value = 0;
  }

  /** 单条已读（未读数乐观 -1） */
  async function readOne(notifyGuid: string): Promise<void> {
    await markNotificationRead(notifyGuid);
    if (unreadCount.value > 0) unreadCount.value -= 1;
  }

  return { unreadCount, initNotifications, refreshUnreadCount, markAllRead, readOne };
});