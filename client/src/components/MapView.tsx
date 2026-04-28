import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Layers } from 'lucide-react';
import HeatmapView from '@/components/HeatmapView';

// Fix Leaflet default icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Severity-based marker colors
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return 'text-red-600';
    case 'HIGH':
      return 'text-orange-600';
    case 'MEDIUM':
      return 'text-yellow-600';
    case 'LOW':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

export interface Report {
  id: string;
  conditionType: string;
  severityLevel: string;
  description: string;
  isResolved?: boolean;
  isActive?: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: string;
  user?: {
    firstName: string;
    username: string;
    id?: string;
  };
  photos?: {
    id: string;
    url: string;
    thumbnailUrl: string;
    caption?: string;
  }[];
  _count?: {
    votes: number;
    comments: number;
  };
}

interface MapViewProps {
  reports: Report[];
  userLocation?: { lat: number; lng: number } | null;
  onReportClick?: (report: Report) => void;
}

// Component to update map center when user location changes
function MapCenterUpdater({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, map]);
  
  return null;
}

export function MapView({ reports, userLocation, onReportClick }: MapViewProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Default center (San Francisco coordinates)
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [37.7749, -122.4194];

  return (
    <Card className="w-full h-[500px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trail Map
          </CardTitle>
          <Button
            size="sm"
            variant={showHeatmap ? "default" : "outline"}
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)]">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full rounded-md"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Heatmap Layer */}
          {showHeatmap && <HeatmapView reports={reports} />}

          <MapCenterUpdater userLocation={userLocation || null} />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Report markers */}
          {reports.map((report) => {
            // Extract coordinates from GeoJSON format
            const coordinates = report.location?.coordinates;
            if (!coordinates || coordinates.length < 2) return null;
            
            // GeoJSON uses [longitude, latitude], Leaflet uses [latitude, longitude]
            const position: [number, number] = [coordinates[1], coordinates[0]];
            
            return (
              <Marker
                key={report.id}
                position={position}
                icon={defaultIcon}
                eventHandlers={{
                  click: () => {
                    onReportClick?.(report);
                  }
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`h-4 w-4 ${getSeverityColor(report.severityLevel)}`} />
                      <span className="font-semibold text-sm">
                        {report.conditionType?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mb-2">
                      {report.description}
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">
                      <p>Severity: <span className={getSeverityColor(report.severityLevel)}>{report.severityLevel}</span></p>
                      <p>Reported by: {report.user?.firstName || report.user?.username || 'Unknown'}</p>
                      <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => onReportClick?.(report)}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
}

export default MapView;
