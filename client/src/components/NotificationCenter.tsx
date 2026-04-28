import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  type: 'REPORT_VERIFIED' | 'REPORT_COMMENTED' | 'REPORT_RESOLVED' | 'MENTION';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  report?: {
    id: string;
    conditionType: string;
    severityLevel: string;
  };
  comment?: {
    id: string;
    content: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/in-app-notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/in-app-notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/in-app-notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/in-app-notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!notifications.find((n) => n.id === id)?.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createTestNotification = async () => {
    try {
      const response = await fetch('/api/in-app-notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REPORT_VERIFIED':
        return '✅';
      case 'REPORT_COMMENTED':
        return '💬';
      case 'REPORT_RESOLVED':
        return '🎉';
      case 'MENTION':
        return '@';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-4 top-16 w-full max-w-md bg-background rounded-lg shadow-xl max-h-[80vh] flex flex-col border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={createTestNotification}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Test
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check size={16} />
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1">
                        {notification.message}
                      </p>
                      {notification.comment && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{notification.comment.content}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="p-3 border-t bg-blue-50 text-center text-sm text-blue-700">
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
