import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

interface UpvoteButtonProps {
  reportId: string;
  initialCount: number;
  hasVoted?: boolean;
  onVoteChange?: (hasVoted: boolean) => void;
}

export function UpvoteButton({ reportId, initialCount, hasVoted: initialHasVoted = false, onVoteChange }: UpvoteButtonProps) {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with prop when it changes from parent
  useEffect(() => {
    setHasVoted(initialHasVoted);
  }, [initialHasVoted]);

  // Also check localStorage on mount (for persistence across refreshes)
  useEffect(() => {
    if (user) {
      const voted = localStorage.getItem(`vote_${reportId}_${user.id}`);
      if (voted) {
        setHasVoted(true);
      }
    }
  }, [reportId, user]);

  const handleUpvote = async () => {
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please log in to verify reports.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (hasVoted) {
        // Remove upvote
        const response = await api.reports.removeUpvote(reportId, token);
        await handleApiResponse(response);
        setCount(prev => Math.max(0, prev - 1));
        setHasVoted(false);
        onVoteChange?.(false);
        // Remove from localStorage
        if (user) {
          localStorage.removeItem(`vote_${reportId}_${user.id}`);
        }
        toast({
          title: "Verification Removed",
          description: "You've removed your verification.",
        });
      } else {
        // Add upvote
        const response = await api.reports.upvote(reportId, token);
        await handleApiResponse(response);
        setCount(prev => prev + 1);
        setHasVoted(true);
        onVoteChange?.(true);
        // Save to localStorage
        if (user) {
          localStorage.setItem(`vote_${reportId}_${user.id}`, 'true');
        }
        toast({
          title: "Report Verified",
          description: "Thank you for verifying this report!",
        });
      }
    } catch (error) {
      console.error('Upvote error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleUpvote}
      disabled={isLoading}
      className={hasVoted ? "bg-green-600 hover:bg-green-700" : ""}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <ThumbsUp className="h-4 w-4 mr-1" />
          {count}
        </>
      )}
    </Button>
  );
}
