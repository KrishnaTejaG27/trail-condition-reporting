import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface HeatmapViewProps {
  reports: Array<{
    id: string;
    location?: {
      coordinates: [number, number];
    };
    severityLevel: string;
  }>;
}

export default function HeatmapView({ reports }: HeatmapViewProps) {
  const map = useMap();
  const heatmapLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || reports.length === 0) return;

    // Remove existing heatmap if it exists
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
    }

    // Prepare heatmap data for Leaflet
    const heatData = reports
      .filter(r => r.location?.coordinates)
      .map(report => ({
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
        intensity: getSeverityWeight(report.severityLevel),
      }));

    if (heatData.length === 0) return;

    // Create circle markers as heatmap representation
    const heatGroup = L.layerGroup(
      heatData.map(point =>
        L.circleMarker([point.lat, point.lng], {
          radius: 20,
          fillColor: getSeverityColor(point.intensity),
          color: 'transparent',
          weight: 0,
          fillOpacity: 0.4,
        })
      )
    );

    heatGroup.addTo(map);
    heatmapLayerRef.current = heatGroup;

    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
    };
  }, [map, reports]);

  return null; // This component doesn't render anything, it just adds layers to the map
}

function getSeverityWeight(severity: string): number {
  switch (severity) {
    case 'CRITICAL':
      return 1;
    case 'HIGH':
      return 0.8;
    case 'MEDIUM':
      return 0.5;
    case 'LOW':
      return 0.3;
    default:
      return 0.3;
  }
}

function getSeverityColor(intensity: number): string {
  if (intensity >= 0.8) return '#dc3545'; // Red for critical/high
  if (intensity >= 0.5) return '#ffc107'; // Yellow for medium
  return '#28a745'; // Green for low
}
