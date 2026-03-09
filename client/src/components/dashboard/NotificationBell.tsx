import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardList, FileText, Check, CheckCheck } from 'lucide-react';
import axios from 'axios';
import type { Notification } from '../../types';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [notifRes, countRes] = await Promise.all([
        axios.get('http://localhost:8000/api/notifications', config),
        axios.get('http://localhost:8000/api/notifications/unread-count', config),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.patch(`http://localhost:8000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.patch('http://localhost:8000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.type === 'TASK_ASSIGNED' && notification.relatedId) {
      navigate(`/admin/tasks`);
    } else if (notification.type === 'ARTICLE_REVIEW' && notification.relatedId) {
      navigate(`/admin/article/review/${notification.relatedId}`);
    }
    setIsOpen(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <ClipboardList className="h-4 w-4 text-blue-500" />;
      case 'ARTICLE_REVIEW':
        return <FileText className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all relative group"
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          Notifications
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-full bottom-0 ml-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[480px] flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                    notification.isRead
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
