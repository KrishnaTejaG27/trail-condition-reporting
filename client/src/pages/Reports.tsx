import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Loader2, Eye } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { token } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">All Reports</h1>
        <p className="text-muted-foreground">View all trail condition reports</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No reports found</p>
            <Button onClick={() => navigate('/app/reports/new')}>
              Create First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/reports/${report.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
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
