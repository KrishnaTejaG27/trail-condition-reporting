import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 text-gray-600 hover:text-black -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-black mb-2">Report New Hazard</h1>
        <p className="text-gray-600">Help keep trails safe by reporting conditions</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-[#485C11] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium text-black">Location</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-[#485C11] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium text-black">Condition</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-[#485C11] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium text-black">Severity</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 4 ? 'bg-[#485C11] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              4
            </div>
            <span className="ml-2 font-medium text-black">Details</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#485C11] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Step 1: Location</h2>
            <p className="text-sm text-gray-600 mt-1">Where is the hazard located?</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-[#485C11]" />
                <span className="text-gray-700">Current Location: 40.7128° N, 74.0060° W</span>
              </div>
              <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">Map will be displayed here</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  Use Current Location
                </Button>
                <Button 
                  onClick={() => setStep(2)}
                  className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full"
                >
                  Next: Condition Type
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Step 2: Condition Type</h2>
            <p className="text-sm text-gray-600 mt-1">What type of hazard are you reporting?</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {conditions.map((condition) => {
                const Icon = condition.icon;
                return (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCondition === condition.id
                        ? 'border-[#485C11] bg-[#485C11]/5'
                        : 'border-gray-200 hover:border-[#485C11]/50'
                    }`}
                  >
                    <div className={`w-12 h-12 ${condition.color} rounded-xl flex items-center justify-center mb-2 mx-auto`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-black">{condition.label}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!selectedCondition}
                className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full"
              >
                Next: Severity
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Step 3: Severity Level</h2>
            <p className="text-sm text-gray-600 mt-1">How severe is this hazard?</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {severities.map((severity) => (
                <button
                  key={severity.id}
                  onClick={() => setSelectedSeverity(severity.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedSeverity === severity.id
                      ? 'border-[#485C11] bg-[#485C11]/5'
                      : 'border-gray-200 hover:border-[#485C11]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${severity.color} rounded-full`} />
                    <div>
                      <p className="font-medium text-black">{severity.label}</p>
                      <p className="text-sm text-gray-600">{severity.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                Back
              </Button>
              <Button 
                onClick={() => setStep(4)} 
                disabled={!selectedSeverity}
                className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full"
              >
                Next: Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-black">Step 4: Details</h2>
            <p className="text-sm text-gray-600 mt-1">Provide additional information about the hazard</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#485C11]/20 focus:border-[#485C11] transition-colors"
                  rows={4}
                  placeholder="Tell others more about this hazard..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#485C11]/50 transition-colors cursor-pointer">
                  <p className="text-gray-500">Click to upload photos</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-medium text-black mb-2">Report Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-black">Type:</span> {conditions.find(c => c.id === selectedCondition)?.label}</p>
                  <p><span className="font-medium text-black">Severity:</span> {severities.find(s => s.id === selectedSeverity)?.label}</p>
                  <p><span className="font-medium text-black">Location:</span> Trail A, 0.5 miles from north entrance</p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="bg-[#485C11] hover:bg-[#485C11]/90 text-white rounded-full px-6"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReport;
