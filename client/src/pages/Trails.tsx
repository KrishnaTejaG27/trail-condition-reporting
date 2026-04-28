import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Route, 
  Mountain, 
  Clock, 
  TrendingUp,
  Loader2,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isResolved: boolean;
  createdAt: string;
}

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
  reports?: Report[];
}

export default function Trails() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [filteredTrails, setFilteredTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrails();
  }, []);

  useEffect(() => {
    filterTrails();
  }, [trails, searchQuery, difficultyFilter]);

  const fetchTrails = async () => {
    try {
      const response = await api.trails.getAll();
      const data = await handleApiResponse(response);
      
      if (data.success) {
        const trailsData = data.data?.trails || [];
        
        // Fetch recent reports for each trail to show conditions
        const trailsWithReports = await Promise.all(
          trailsData.map(async (trail: Trail) => {
            try {
              const reportsResponse = await api.reports.getAll({ 
                trailId: trail.id,
                limit: 5,
                isResolved: false
              });
              const reportsData = await handleApiResponse(reportsResponse);
              return {
                ...trail,
                reports: reportsData.data?.reports || []
              };
            } catch {
              return { ...trail, reports: [] };
            }
          })
        );
        
        setTrails(trailsWithReports);
      }
    } catch (error) {
      console.error('Error fetching trails:', error);
      toast({
        title: "Failed to load trails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrailStatus = (reports: Report[] = []) => {
    const activeReports = reports.filter(r => !r.isResolved);
    const highSeverity = activeReports.filter(r => r.severityLevel === 'HIGH').length;
    const mediumSeverity = activeReports.filter(r => r.severityLevel === 'MEDIUM').length;
    const lastReport = activeReports[0];
    
    if (highSeverity > 0) return { 
      text: '⚠️ Hazards Reported', 
      color: 'bg-red-500', 
      icon: AlertTriangle,
      count: activeReports.length,
      lastUpdate: lastReport?.createdAt
    };
    if (mediumSeverity > 0) return { 
      text: '⚡ Caution', 
      color: 'bg-yellow-500', 
      icon: AlertTriangle,
      count: activeReports.length,
      lastUpdate: lastReport?.createdAt
    };
    if (activeReports.length > 0) return { 
      text: 'ℹ️ Minor Issues', 
      color: 'bg-blue-500', 
      icon: AlertTriangle,
      count: activeReports.length,
      lastUpdate: lastReport?.createdAt
    };
    return { 
      text: '✅ Clear', 
      color: 'bg-green-500', 
      icon: CheckCircle,
      count: 0,
      lastUpdate: null
    };
  };

  const filterTrails = () => {
    let filtered = trails;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(trail =>
        trail.name.toLowerCase().includes(query) ||
        trail.description.toLowerCase().includes(query) ||
        trail.location.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(trail => trail.difficulty === difficultyFilter);
    }

    setFilteredTrails(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500';
      case 'MODERATE': return 'bg-yellow-500';
      case 'HARD': return 'bg-red-500';
      default: return 'bg-gray-500';
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trails</h1>
          <p className="text-muted-foreground">
            {trails.length} trails available
          </p>
        </div>
        <Button onClick={() => navigate('/app/reports/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MODERATE">Moderate</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Trails Grid */}
      {filteredTrails.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No trails found</p>
            {trails.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Trails can be imported from the Admin Dashboard
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrails.map((trail) => {
            const status = getTrailStatus(trail.reports);
            return (
              <Card 
                key={trail.id} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20"
                onClick={() => navigate(`/app/trails/${trail.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                        {trail.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{trail.location}</span>
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(trail.difficulty)}>
                      {trail.difficulty}
                    </Badge>
                  </div>
                  
                  {/* Live Condition Badge */}
                  <div className="mt-3">
                    <Badge className={`${status.color} text-white text-xs`}>
                      <status.icon className="h-3 w-3 mr-1" />
                      {status.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {trail.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-muted rounded">
                      <Route className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{trail.length} mi</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{trail.elevationGain} ft</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{trail.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  {status.lastUpdate && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Last report: {formatDistanceToNow(new Date(status.lastUpdate))} ago
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/reports/create?trailId=${trail.id}`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/trails/${trail.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
