import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Eye, FileText, Bell } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useSocket } from '@/hooks/useSocket';

interface Report {
  id: string;
  conditionType: string;
  severityLevel: string;
  description: string;
  isResolved: boolean;
  location: {
    coordinates: [number, number];
  };
  createdAt: string;
  user?: {
    firstName: string;
    username: string;
  };
  _count?: {
    votes: number;
    comments: number;
  };
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { joinReports, joinUser, onReportCreated, onReportUpdated, onReportDeleted, onVoteUpdated, onNotification } = useSocket();

  // Real-time socket listeners
  useEffect(() => {
    if (!token || !user) return;

    joinReports();
    joinUser(user.id);

    const unsubscribeCreated = onReportCreated((newReport) => {
      console.log('🆕 Reports page: New report', newReport);
      setReports(prev => [newReport, ...prev]);
      toast({
        title: "🚨 New Report",
        description: `${newReport.conditionType} reported by ${newReport.user?.firstName || 'someone'}`,
      });
    });

    const unsubscribeUpdated = onReportUpdated((updatedReport) => {
      console.log('🔄 Reports page: Report updated', updatedReport);
      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    });

    const unsubscribeDeleted = onReportDeleted(({ id }) => {
      console.log('🗑️ Reports page: Report deleted', id);
      setReports(prev => prev.filter(r => r.id !== id));
    });

    const unsubscribeVote = onVoteUpdated(({ reportId, voteCount }) => {
      console.log('👍 Reports page: Vote updated', reportId, voteCount);
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, _count: { ...r._count, votes: voteCount } } : r
      ));
    });

    const unsubscribeNotification = onNotification((notification) => {
      console.log('🔔 Reports page: Notification', notification);
      setUnreadNotifications(prev => prev + 1);
      toast({
        title: `🔔 ${notification.title}`,
        description: notification.message,
      });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeVote();
      unsubscribeNotification();
    };
  }, [token, user, joinReports, joinUser, onReportCreated, onReportUpdated, onReportDeleted, onVoteUpdated, onNotification, toast]);

  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.reports.getAll();
      const data = await handleApiResponse(response);
      setReports(data.data?.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Failed to load reports",
        description: error instanceof Error ? error.message : "Could not fetch reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-700 text-white';
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Reports</h1>
          <p className="text-muted-foreground">View all trail condition reports</p>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-muted-foreground" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Be the first to report a trail condition and help keep the community safe!"
            actionLabel="Create First Report"
            onAction={() => navigate('/app/reports/new')}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card 
              key={report.id} 
              className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              onClick={() => navigate(`/app/reports/${report.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {report.conditionType?.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                    <Badge className={getSeverityColor(report.severityLevel)}>
                      {report.severityLevel}
                    </Badge>
                    {report.isResolved && (
                      <Badge variant="outline">Resolved</Badge>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {report.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {report.location?.coordinates?.[1]?.toFixed(4)}, {report.location?.coordinates?.[0]?.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{report._count?.votes || 0} verifications</span>
                    <span>{report._count?.comments || 0} comments</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
