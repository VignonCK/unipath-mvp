import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Réactiver quand les routes API seront implémentées
    // fetchUnreadCount();
    // if (isOpen) {
    //   fetchNotifications();
    // }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Implémenter la route /api/notifications
      // const response = await fetch('/api/notifications', {
      //   headers: {
      //     'x-user-id': localStorage.getItem('userId')
      //   }
      // });
      // const data = await response.json();
      // setNotifications(data);
      setNotifications([]); // Temporaire
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      // TODO: Implémenter la route /api/notifications/unread-count
      // const response = await fetch('/api/notifications/unread-count', {
      //   headers: {
      //     'x-user-id': localStorage.getItem('userId')
      //   }
      // });
      // const data = await response.json();
      // setUnreadCount(data.count);
      setUnreadCount(0); // Temporaire
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      // TODO: Implémenter la route /api/notifications/:id/read
      // await fetch(`/api/notifications/${id}/read`, {
      //   method: 'PATCH',
      //   headers: {
      //     'x-user-id': localStorage.getItem('userId')
      //   }
      // });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implémenter la route /api/notifications/read-all
      // await fetch('/api/notifications/read-all', {
      //   method: 'PATCH',
      //   headers: {
      //     'x-user-id': localStorage.getItem('userId')
      //   }
      // });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
