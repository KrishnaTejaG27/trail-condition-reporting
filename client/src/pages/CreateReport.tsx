import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, TreePine, Waves, Mountain } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const CreateReport = () => {
  const [step, setStep] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedCondition || !selectedSeverity) {
      toast({
        title: "Missing Information",
        description: "Please select condition type and severity level",
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
          coordinates: [-122.4194, 37.7749] // Default location (San Francisco)
        },
        trailId: "trail_1"
      };

      await api.reports.create(reportData, token || undefined);
      
      toast({
        title: "Report Submitted!",
        description: "Your hazard report has been successfully submitted.",
      });
      
      navigate('/app');
    } catch (error) {
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
              Where is the hazard located?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Current Location: 40.7128° N, 74.0060° W</span>
              </div>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Map will be displayed here</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline">Use Current Location</Button>
                <Button onClick={() => setStep(2)}>Next: Condition Type</Button>
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
              Provide additional information about the hazard
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
              
              <div>
                <label className="block text-sm font-medium mb-2">Photos</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Click to upload photos</p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Report Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Type:</span> {conditions.find(c => c.id === selectedCondition)?.label}</p>
                  <p><span className="font-medium">Severity:</span> {severities.find(s => s.id === selectedSeverity)?.label}</p>
                  <p><span className="font-medium">Location:</span> Trail A, 0.5 miles from north entrance</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
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
