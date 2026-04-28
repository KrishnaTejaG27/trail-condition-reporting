import { createContext, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';

interface SocketContextType {
  joinReports: () => void;
  joinTrail: (trailId: string) => void;
  leaveTrail: (trailId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const {
    joinReports,
    joinTrail,
    leaveTrail,
    onReportCreated,
    onReportUpdated,
    onReportDeleted,
    onVoteUpdated,
  } = useSocket();

  // Handle report created
  useEffect(() => {
    const unsubscribe = onReportCreated((report) => {
      toast({
        title: '🚨 New Hazard Reported',
        description: `${report.conditionType?.replace('_', ' ')} reported nearby`,
        variant: 'warning',
      });
    });
    return unsubscribe;
  }, [onReportCreated, toast]);

  // Handle report updated
  useEffect(() => {
    const unsubscribe = onReportUpdated((report) => {
      if (report.isResolved) {
        toast({
          title: '✅ Hazard Resolved',
          description: `A hazard has been marked as resolved`,
          variant: 'success',
        });
      }
    });
    return unsubscribe;
  }, [onReportUpdated, toast]);

  // Handle vote updates
  useEffect(() => {
    const unsubscribe = onVoteUpdated((data) => {
      console.log('Vote updated:', data);
    });
    return unsubscribe;
  }, [onVoteUpdated]);

  // Join global reports room on mount
  useEffect(() => {
    joinReports();
  }, [joinReports]);

  const value = {
    joinReports,
    joinTrail,
    leaveTrail,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
