import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, ThumbsUp, Loader2, CheckCircle } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Comments } from '@/components/Comments';

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
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  trail?: {
    name: string;
  };
  photos?: { id: string; url: string }[];
  _count?: {
    votes: number;
    comments: number;
  };
}

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id, token]);

  const fetchReport = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await api.reports.getById(id);
      const data = await handleApiResponse(response);
      
      if (data.success && data.data?.report) {
        console.log('Report data:', data.data.report);
        console.log('Photos:', data.data.report.photos);
        setReport(data.data.report);
        setVoteCount(data.data.report._count?.votes || 0);
      } else {
        toast({
          title: "Report not found",
          description: "The report you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/app/reports');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Failed to load report",
        description: error instanceof Error ? error.message : "Could not fetch report details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!token || !id) {
      toast({
        title: "Authentication required",
        description: "Please log in to verify reports.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (hasVoted) {
        await api.reports.removeUpvote(id, token);
        setHasVoted(false);
        setVoteCount(prev => prev - 1);
      } else {
        await api.reports.upvote(id, token);
        setHasVoted(true);
        setVoteCount(prev => prev + 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vote",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async () => {
    if (!token || !id || !report) {
      toast({
        title: "Authentication required",
        description: "Please log in to resolve reports.",
        variant: "destructive",
      });
      return;
    }

    // Only allow creator to resolve
    if (report.user?.id !== user?.id) {
      toast({
        title: "Not authorized",
        description: "Only the report creator can mark this as resolved.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.reports.update(id, { isResolved: true }, token);
      const data = await handleApiResponse(response);
      
      if (data.success) {
        setReport({ ...report, isResolved: true });
        toast({
          title: "Report resolved",
          description: "Thank you for updating the status!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve report",
        variant: "destructive",
      });
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

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffHours = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
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

  if (!report) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/app/reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold">Report Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {report.conditionType?.replace('_', ' ').toUpperCase()}
                  <Badge className={getSeverityColor(report.severityLevel)}>
                    {report.severityLevel}
                  </Badge>
                  {report.isResolved && (
                    <Badge variant="outline">Resolved</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTimeAgo(report.createdAt)}
                </div>
              </div>
              <CardDescription>
                Reported by @{report.user?.username || 'unknown'} on {report.trail?.name || 'Unknown Trail'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {report.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {report.location?.coordinates?.[1]?.toFixed(6)}, {report.location?.coordinates?.[0]?.toFixed(6)}
                  </div>
                </div>

                {report.photos && report.photos.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Photos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {report.photos.map((photo) => (
                        <img 
                          key={photo.id} 
                          src={photo.url} 
                          alt="Report photo" 
                          className="aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={hasVoted ? "default" : "outline"}
                  onClick={handleVote}
                  disabled={!token}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {hasVoted ? 'Confirmed' : 'Confirm'} ({voteCount})
                </Button>
                
                {/* Show resolve button only to report creator if not already resolved */}
                {report.user?.id === user?.id && !report.isResolved && (
                  <Button 
                    variant="outline"
                    onClick={handleResolve}
                    disabled={!token}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
                
                {report.isResolved && (
                  <Badge variant="default" className="h-10 px-4 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          {id && (
            <Comments 
              reportId={id} 
              commentCount={report._count?.comments || 0}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reporter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  {getInitials(report.user?.firstName || '')}
                </div>
                <div>
                  <p className="font-medium">@{report.user?.username || 'unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.user?.firstName} {report.user?.lastName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Verification</span>
                  <Badge>{voteCount > 0 ? 'Verified' : 'Unverified'} ({voteCount})</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolution</span>
                  <Badge variant={report.isResolved ? "default" : "outline"}>
                    {report.isResolved ? 'Resolved' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Severity</span>
                  <Badge className={getSeverityColor(report.severityLevel)}>
                    {report.severityLevel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
