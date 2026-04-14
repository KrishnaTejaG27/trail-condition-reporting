import { useState, useEffect } from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  description?: string;
  timestamp: string;
}

interface AlertBannerProps {
  alerts?: Alert[];
  autoDismiss?: boolean;
  dismissAfter?: number;
}

const alertStyles = {
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    Icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    Icon: Info
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    Icon: CheckCircle
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    Icon: AlertTriangle
  }
};

export function AlertBanner({ 
  alerts: propAlerts, 
  autoDismiss = true, 
  dismissAfter = 10000 
}: AlertBannerProps) {
  const [alerts, setAlerts] = useState<Alert[]>(propAlerts || []);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Simulate fetching alerts from API
  useEffect(() => {
    if (!propAlerts) {
      // Mock alerts - in real app, fetch from /api/alerts
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'warning',
          message: 'Weather Alert',
          description: 'Heavy rain expected this weekend. Trails may be slippery.',
          timestamp: new Date().toISOString()
        }
      ];
      setAlerts(mockAlerts);
    }
  }, [propAlerts]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (autoDismiss && alerts.length > 0) {
      const timer = setTimeout(() => {
        const newDismissed = new Set(dismissed);
        alerts.forEach(alert => {
          if (!newDismissed.has(alert.id)) {
            newDismissed.add(alert.id);
          }
        });
        setDismissed(newDismissed);
      }, dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [alerts, autoDismiss, dismissAfter, dismissed]);

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(alertId);
    setDismissed(newDismissed);
  };

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2 w-full">
      {visibleAlerts.map((alert) => {
        const style = alertStyles[alert.type];
        const Icon = style.Icon;

        return (
          <div
            key={alert.id}
            className={`${style.bg} border rounded-lg p-4 flex items-start justify-between gap-3 shadow-sm`}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className={`h-5 w-5 ${style.icon} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">
                  {alert.message}
                </p>
                {alert.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => handleDismiss(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default AlertBanner;
