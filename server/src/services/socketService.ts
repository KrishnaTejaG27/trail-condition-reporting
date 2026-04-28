import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HttpServer, corsOrigin: string) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [corsOrigin, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join room for specific trail updates
    socket.on('join-trail', (trailId: string) => {
      socket.join(`trail-${trailId}`);
      console.log(`Socket ${socket.id} joined trail-${trailId}`);
    });

    // Join room for global reports
    socket.on('join-reports', () => {
      socket.join('reports');
      console.log(`Socket ${socket.id} joined reports room`);
    });

    // Join user-specific room for notifications
    socket.on('join-user', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user-${userId}`);
    });

    // Leave rooms
    socket.on('leave-trail', (trailId: string) => {
      socket.leave(`trail-${trailId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit events
export const emitReportCreated = (report: any) => {
  if (io) {
    // Broadcast to all connected clients (including those not in rooms)
    io.emit('report:created', report);
    // Also send to specific rooms
    io.to('reports').emit('report:created', report);
    if (report.trailId) {
      io.to(`trail-${report.trailId}`).emit('report:created', report);
    }
    console.log('📢 Emitted report:created to', io.engine.clientsCount, 'clients');
  } else {
    console.log('⚠️ Socket.IO not initialized, report:created not emitted');
  }
};

export const emitReportUpdated = (report: any) => {
  if (io) {
    io.emit('report:updated', report);
    io.to('reports').emit('report:updated', report);
    if (report.trailId) {
      io.to(`trail-${report.trailId}`).emit('report:updated', report);
    }
    console.log('📢 Emitted report:updated to', io.engine.clientsCount, 'clients');
  } else {
    console.log('⚠️ Socket.IO not initialized, report:updated not emitted');
  }
};

export const emitReportDeleted = (reportId: string, trailId?: string) => {
  if (io) {
    io.emit('report:deleted', { id: reportId });
    io.to('reports').emit('report:deleted', { id: reportId });
    if (trailId) {
      io.to(`trail-${trailId}`).emit('report:deleted', { id: reportId });
    }
    console.log('📢 Emitted report:deleted to', io.engine.clientsCount, 'clients');
  } else {
    console.log('⚠️ Socket.IO not initialized, report:deleted not emitted');
  }
};

export const emitVoteUpdated = (reportId: string, voteCount: number) => {
  if (io) {
    io.emit('vote:updated', { reportId, voteCount });
    io.to('reports').emit('vote:updated', { reportId, voteCount });
    console.log('📢 Emitted vote:updated to', io.engine.clientsCount, 'clients');
  } else {
    console.log('⚠️ Socket.IO not initialized, vote:updated not emitted');
  }
};

export const emitCommentAdded = (reportId: string, comment: any) => {
  if (io) {
    io.to(`report-${reportId}`).emit('comment:added', { reportId, comment });
    console.log('📢 Emitted comment:added');
  }
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    // Emit to user-specific room (user needs to join user-{userId} room)
    io.to(`user-${userId}`).emit('notification:new', notification);
    console.log('📢 Emitted notification:new to user', userId);
  }
};
