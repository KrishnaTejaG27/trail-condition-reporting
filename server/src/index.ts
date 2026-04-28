import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initializeSocket } from '@/services/socketService';

// Using mock auth routes for testing without database
import authRoutes from '@/routes/mockAuth';
import userRoutes from '@/routes/users';
import reportRoutes from '@/routes/reports';
import trailRoutes from '@/routes/trails';
import notificationRoutes from '@/routes/notifications';
import analyticsRoutes from '@/routes/analytics';
import adminRoutes from '@/routes/admin';
import userStatsRoutes from '@/routes/userStats';
import trailImportRoutes from '@/routes/trailImport';
import pushRoutes from '@/routes/push';
import weatherRoutes from '@/routes/weather';
import aiClassificationRoutes from '@/routes/aiClassification';
import inAppNotificationRoutes from '@/routes/inAppNotifications';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { seedTrails } from '@/controllers/trailController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per windowMs for dev
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trails', trailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userStatsRoutes);
app.use('/api/trails/import', trailImportRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiClassificationRoutes);
app.use('/api/in-app-notifications', inAppNotificationRoutes);

// Seed sample trails on startup (with error handling for mock mode)
try {
  seedTrails();
} catch (error) {
  console.log('Skipping trail seeding (likely running in mock mode without database)');
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer, FRONTEND_URL);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket ready`);
});

export default app;
