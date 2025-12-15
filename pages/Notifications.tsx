
import React from 'react';
import { Notification } from '../types';
import { Card, Button } from '../components/UI';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAllRead }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
        case 'SUCCESS': return <CheckCircle className="w-6 h-6 text-green-500" />;
        case 'WARNING': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
        case 'ERROR': return <AlertTriangle className="w-6 h-6 text-red-500" />;
        default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            Notifications
        </h1>
        {notifications.some(n => !n.isRead) && (
            <Button size="sm" variant="secondary" onClick={onMarkAllRead}>
                <Check className="w-4 h-4 mr-1" /> Mark all read
            </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-600 dark:text-slate-400">No Notifications</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm">You're all caught up!</p>
            </div>
        ) : (
            notifications.map((notif) => (
                <Card 
                    key={notif.id} 
                    className={clsx(
                        "p-4 transition-all hover:shadow-md border-l-4",
                        notif.isRead 
                          ? "border-l-slate-200 dark:border-l-slate-700 opacity-80" 
                          : "border-l-primary-500 bg-white dark:bg-slate-900"
                    )}
                >
                    <div className="flex gap-4">
                        <div className="mt-1">
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                            <h3 className={clsx("font-bold text-base", notif.isRead ? "text-slate-700 dark:text-slate-400" : "text-slate-900 dark:text-white")}>
                                {notif.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{notif.message}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                                </span>
                                {notif.link && (
                                    <Link to={notif.link} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                        View Details
                                    </Link>
                                )}
                            </div>
                        </div>
                        {!notif.isRead && (
                             <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0"></div>
                        )}
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
};
