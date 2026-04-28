import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Route, 
  Mountain, 
  Clock, 
  TrendingUp,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Plus,
  Map,
  Navigation
} from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Trail {
  id: string;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  length: number;
  location: string;
  elevationGain: number;
  estimatedTime: string;
  features: string[];
  surfaceTypes: string[];
  status: string;
  createdAt: string;
}

interface Report {
  id: string;
  conditionType: string;
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  isResolved: boolean;
  createdAt: string;
  user: {
    username: string;
    firstName: string | null;
  };
  _count: {
    votes: number;
  };
}

export default function TrailDetail() {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [trail, setTrail] = useState<Trail | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trailId) {
      fetchTrailAndReports();
    }
  }, [trailId]);

  const fetchTrailAndReports = async () => {
    try {
      // Fetch trail details
      const trailResponse = await api.trails.getById(trailId!);
      const trailData = await handleApiResponse(trailResponse);
      
      if (trailData.success) {
        setTrail(trailData.data?.trail);
      }

      // Fetch reports for this trail
      const reportsResponse = await api.reports.getAll({ trailId: trailId! });
      const reportsData = await handleApiResponse(reportsResponse);
      
      if (reportsData.success) {
        setReports(reportsData.data?.reports || []);
      }
    } catch (error) {
      console.error('Error fetching trail:', error);
      toast({
        title: "Failed to load trail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500';
      case 'MODERATE': return 'bg-yellow-500';
      case 'HARD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const activeReports = reports.filter(r => !r.isResolved);
  const resolvedReports = reports.filter(r => r.isResolved);

  const getTrailStatus = () => {
    const highSeverity = activeReports.filter(r => r.severityLevel === 'HIGH').length;
    const mediumSeverity = activeReports.filter(r => r.severityLevel === 'MEDIUM').length;
    
    if (highSeverity > 0) return { text: 'Caution Advised', color: 'bg-red-500', icon: AlertTriangle };
    if (mediumSeverity > 0) return { text: 'Some Hazards', color: 'bg-yellow-500', icon: AlertTriangle };
    if (activeReports.length > 0) return { text: 'Minor Issues', color: 'bg-blue-500', icon: AlertTriangle };
    return { text: 'Trail Clear', color: 'bg-green-500', icon: CheckCircle };
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

  if (!trail) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/app/trails')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trails
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Trail not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getTrailStatus();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/app/trails')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Trails
      </Button>

      {/* Trail Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{trail.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{trail.location}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/app/reports/create?trailId=${trail.id}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button 
              onClick={() => navigate(`/app?trailId=${trail.id}`)}
            >
              <Map className="h-4 w-4 mr-2" />
              View on Map
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4 mb-6">
          <Badge className={`${status.color} text-white text-sm px-4 py-1`}>
            <status.icon className="h-4 w-4 mr-2" />
            {status.text}
          </Badge>
          <Badge className={getDifficultyColor(trail.difficulty)}>
            {trail.difficulty}
          </Badge>
          {activeReports.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {activeReports.length} active hazard{activeReports.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Trail Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Route className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{trail.length}</p>
              <p className="text-xs text-muted-foreground">miles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{trail.elevationGain}</p>
              <p className="text-xs text-muted-foreground">ft elevation</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{trail.estimatedTime}</p>
              <p className="text-xs text-muted-foreground">est. time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Navigation className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-xs text-muted-foreground">reports</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Trail Info */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About This Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {trail.description}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          {trail.features && trail.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trail Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trail.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Surface Types */}
          {trail.surfaceTypes && trail.surfaceTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Surface Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trail.surfaceTypes.map((surface, idx) => (
                    <Badge key={idx} variant="outline">
                      {surface}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Reports */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Hazards */}
          {activeReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Active Hazards ({activeReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(report.severityLevel)}>
                            {report.severityLevel}
                          </Badge>
                          <span className="font-medium">{report.conditionType.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {report.user.firstName || report.user.username} • {formatDistanceToNow(new Date(report.createdAt))} ago
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {report._count.votes} verifications
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                ))}
                {activeReports.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{activeReports.length - 5} more active hazards
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recently Resolved */}
          {resolvedReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Recently Resolved ({resolvedReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resolvedReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center gap-3 p-3 border rounded-lg opacity-70">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through">
                        {report.conditionType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Resolved {formatDistanceToNow(new Date(report.createdAt))} ago
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* No Reports */}
          {reports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Mountain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No reports yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to report trail conditions!
                </p>
                <Button onClick={() => navigate(`/app/reports/create?trailId=${trail.id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
