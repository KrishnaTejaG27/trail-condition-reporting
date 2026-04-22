import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, TreePine, Waves, Mountain, Camera, X, Loader2, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api, handleApiResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Map click handler component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const CreateReport = () => {
  const [step, setStep] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location state
  const [, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Photos state
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, token, isAuthenticated } = useAuthStore();
  
  // Debug: Log auth status
  console.log('Auth Status:', { user: user?.email, token: token ? 'exists' : 'missing', isAuthenticated });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a report.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
  }, [isAuthenticated, token, navigate, toast]);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setSelectedLocation({ lat: latitude, lng: longitude });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsGettingLocation(false);
          
          // Show different message based on error type
          let errorMessage = "Please enable location access in your browser settings to use your current location.";
          if (error.code === 1) {
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please check your device's GPS settings.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          
          toast({
            title: "Location Access Required",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, [toast]);

  // Cleanup photo preview URLs
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          setIsGettingLocation(false);
          toast({
            title: "Location Updated",
            description: "Your current location has been set.",
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please select on map.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  }, []);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = selectedPhotos.length + newFiles.length;
    
    if (totalPhotos > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed. Please select fewer photos.",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes (max 5MB each)
    const invalidFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each photo must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPhotos(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedCondition || !selectedSeverity) {
      toast({
        title: "Missing Information",
        description: "Please select condition type and severity level",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reportData = {
        conditionType: selectedCondition.toUpperCase(),
        severityLevel: selectedSeverity.toUpperCase(),
        description: description || `${selectedCondition} hazard reported`,
        location: {
          type: "Point",
          coordinates: [selectedLocation.lng, selectedLocation.lat]
        },
      };

      console.log('Submitting report:', reportData);
      console.log('Token:', token ? 'exists' : 'missing');
      
      const response = await api.reports.create(reportData, token || undefined);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await handleApiResponse(response);
      console.log('API response data:', data);
      
      // Upload photos if any
      if (selectedPhotos.length > 0 && data.data?.report?.id) {
        const reportId = data.data.report.id;
        for (const photo of selectedPhotos) {
          try {
            await api.uploadPhoto(reportId, photo, token || '');
          } catch (photoError) {
            console.error('Error uploading photo:', photoError);
          }
        }
      }
      
      toast({
        title: "Report Submitted!",
        description: `Your hazard report has been successfully submitted.${selectedPhotos.length > 0 ? ` ${selectedPhotos.length} photo(s) uploaded.` : ''}`,
      });
      
      navigate('/app');
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'No message');
      
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditions = [
    { id: 'fallen_tree', label: 'Fallen Tree', icon: TreePine, color: 'bg-amber-600' },
    { id: 'mud', label: 'Mud', icon: Mountain, color: 'bg-amber-700' },
    { id: 'flooding', label: 'Flooding', icon: Waves, color: 'bg-blue-600' },
    { id: 'ice', label: 'Ice', icon: Mountain, color: 'bg-cyan-600' },
  ];

  const severities = [
    { id: 'low', label: 'Low', description: 'Minor inconvenience', color: 'bg-green-500' },
    { id: 'medium', label: 'Medium', description: 'Requires caution', color: 'bg-yellow-500' },
    { id: 'high', label: 'High', description: 'Dangerous conditions', color: 'bg-orange-500' },
    { id: 'critical', label: 'Critical', description: 'Life-threatening', color: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Report New Hazard</h1>
        <p className="text-muted-foreground">Help keep trails safe by reporting conditions</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Location</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Condition</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Severity</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              4
            </div>
            <span className="ml-2 font-medium">Details</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Location</CardTitle>
            <CardDescription>
              Select the hazard location on the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Location Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>
                    {selectedLocation 
                      ? `Selected: ${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`
                      : 'Click on map or use button below to set location'
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting location...</>
                  ) : (
                    <><MapPin className="h-4 w-4 mr-2" /> Use My Location</>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Tip: If location doesn't work, make sure you've allowed location access in your browser settings, then click "Use My Location" above.
              </p>

              {/* Real Map */}
              <div className="h-64 rounded-lg overflow-hidden border">
                {selectedLocation ? (
                  <MapContainer
                    center={[selectedLocation.lat, selectedLocation.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    <Marker 
                      position={[selectedLocation.lat, selectedLocation.lng]}
                      icon={defaultIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>Hazard Location</strong><br />
                          {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-4">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground mb-2">No location selected</p>
                    <p className="text-center text-xs text-muted-foreground">
                      Click "Use My Location" above or select a location on the map once it appears
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                💡 Tip: Click anywhere on the map to set the hazard location
              </p>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting Location...</>
                  ) : (
                    <><MapPin className="h-4 w-4 mr-2" /> Use My Location</>
                  )}
                </Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!selectedLocation}
                >
                  Next: Condition Type
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Condition Type</CardTitle>
            <CardDescription>
              What type of hazard are you reporting?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {conditions.map((condition) => {
                const Icon = condition.icon;
                return (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCondition === condition.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-12 h-12 ${condition.color} rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium">{condition.label}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedCondition}>
                Next: Severity
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Severity Level</CardTitle>
            <CardDescription>
              How severe is this hazard?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {severities.map((severity) => (
                <button
                  key={severity.id}
                  onClick={() => setSelectedSeverity(severity.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSeverity === severity.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${severity.color} rounded-full`} />
                    <div>
                      <p className="font-medium">{severity.label}</p>
                      <p className="text-sm text-muted-foreground">{severity.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!selectedSeverity}>
                Next: Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Details</CardTitle>
            <CardDescription>
              Provide additional information and photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="Tell others more about this hazard..."
                />
              </div>
              
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Photos {selectedPhotos.length > 0 && `(${selectedPhotos.length}/5)`}
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                />
                
                {/* Photo Preview Grid */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                {selectedPhotos.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                  >
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload photos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5 photos, 5MB each (JPEG, PNG)
                    </p>
                  </button>
                )}
              </div>

              {/* Report Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Report Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Type:</span> {conditions.find(c => c.id === selectedCondition)?.label}</p>
                  <p><span className="font-medium">Severity:</span> {severities.find(s => s.id === selectedSeverity)?.label}</p>
                  <p><span className="font-medium">Location:</span> {selectedLocation ? `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°` : 'Not set'}</p>
                  {selectedPhotos.length > 0 && (
                    <p><span className="font-medium">Photos:</span> {selectedPhotos.length} photo(s) ready to upload</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Submit Report</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateReport;
