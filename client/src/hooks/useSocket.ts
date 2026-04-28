import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

type ReportHandler = (report: any) => void;
type DeleteHandler = (data: { id: string }) => void;
type VoteHandler = (data: { reportId: string; voteCount: number }) => void;
type CommentHandler = (data: { reportId: string; comment: any }) => void;
type NotificationHandler = (notification: any) => void;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔌 Attempting Socket.IO connection to:', SOCKET_URL);
    
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected! ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error.message);
    });

    // Listen for all events for debugging
    socket.onAny((eventName, ...args) => {
      console.log('📨 Socket event received:', eventName, args);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinReports = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('join-reports');
    }
  }, []);

  const joinTrail = useCallback((trailId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-trail', trailId);
    }
  }, []);

  const leaveTrail = useCallback((trailId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-trail', trailId);
    }
  }, []);

  const joinUser = useCallback((userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-user', userId);
    }
  }, []);

  const onReportCreated = useCallback((handler: ReportHandler) => {
    if (socketRef.current) {
      socketRef.current.on('report:created', handler);
      return () => {
        socketRef.current?.off('report:created', handler);
      };
    }
    return () => {};
  }, []);

  const onReportUpdated = useCallback((handler: ReportHandler) => {
    if (socketRef.current) {
      socketRef.current.on('report:updated', handler);
      return () => {
        socketRef.current?.off('report:updated', handler);
      };
    }
    return () => {};
  }, []);

  const onReportDeleted = useCallback((handler: DeleteHandler) => {
    if (socketRef.current) {
      socketRef.current.on('report:deleted', handler);
      return () => {
        socketRef.current?.off('report:deleted', handler);
      };
    }
    return () => {};
  }, []);

  const onVoteUpdated = useCallback((handler: VoteHandler) => {
    if (socketRef.current) {
      socketRef.current.on('vote:updated', handler);
      return () => {
        socketRef.current?.off('vote:updated', handler);
      };
    }
    return () => {};
  }, []);

  const onCommentAdded = useCallback((handler: CommentHandler) => {
    if (socketRef.current) {
      socketRef.current.on('comment:added', handler);
      return () => {
        socketRef.current?.off('comment:added', handler);
      };
    }
    return () => {};
  }, []);

  const onNotification = useCallback((handler: NotificationHandler) => {
    if (socketRef.current) {
      socketRef.current.on('notification:new', handler);
      return () => {
        socketRef.current?.off('notification:new', handler);
      };
    }
    return () => {};
  }, []);

  return {
    socket: socketRef.current,
    joinReports,
    joinTrail,
    leaveTrail,
    joinUser,
    onReportCreated,
    onReportUpdated,
    onReportDeleted,
    onVoteUpdated,
    onCommentAdded,
    onNotification,
  };
};
