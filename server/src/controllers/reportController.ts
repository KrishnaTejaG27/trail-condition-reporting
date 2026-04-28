import { Response } from 'express';
import { prisma } from '@/index';
import { sendNotificationToNearbyUsers, NotificationTemplates } from '@/services/pushService';
import { AuthRequest } from '@/middleware/auth';
import { mockReports, mockPhotos, mockUsers, addReport, addPhoto, addComment, getComments, getCommentCount, deleteComment as deleteCommentFromDb, addVote, removeVote, hasUserVoted, getVoteCount, updateReport as updateReportInMock, generateUniqueId } from '@/mockDb';
import { dbMockTrails } from '@/controllers/trailController';
import { uploadToS3 } from '@/services/s3Service';
import { notifyReportCommented, notifyReportVerified, notifyReportResolved } from '@/services/inAppNotificationService';
import { emitReportCreated, emitReportUpdated, emitReportDeleted, emitVoteUpdated, emitCommentAdded } from '@/services/socketService';

// Get all reports (with filtering and pagination)
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      conditionType,
      severityLevel,
      trailId,
      isActive = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Try database first, fall back to mock
    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { isActive: isActive === 'true' };

      if (conditionType) where.conditionType = conditionType;
      if (severityLevel) where.severityLevel = severityLevel;
      if (trailId) where.trailId = trailId;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                profileImageUrl: true,
              },
            },
            trail: {
              select: {
                id: true,
                name: true,
                parkId: true,
              },
            },
            photos: {
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                caption: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            [sortBy as string]: sortOrder,
          },
          skip,
          take: Number(limit),
        }),
        prisma.report.count({ where }),
      ]);

      return res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (dbError) {
      // Database not available, use mock data
      console.log('Using mock reports data');
      console.log('Mock reports count:', mockReports.length);
      console.log('Mock reports:', mockReports.map(r => ({ id: r.id, isActive: r.isActive })));
      
      // Parse isActive parameter - handle both string from query and boolean default
      const isActiveBool = isActive === true || isActive === 'true';
      console.log('isActive param:', isActive, 'type:', typeof isActive, 'parsed:', isActiveBool);
      
      let reports = mockReports.filter(r => {
        const match = r.isActive === isActiveBool;
        console.log('Filtering report:', r.id, 'report.isActive:', r.isActive, 'match:', match);
        return match;
      });
      
      if (conditionType) {
        reports = reports.filter(r => r.conditionType === conditionType);
      }
      if (severityLevel) {
        reports = reports.filter(r => r.severityLevel === severityLevel);
      }
      if (trailId) {
        reports = reports.filter(r => r.trailId === trailId);
      }

      // Add mock user data to each report
      console.log('mockPhotos count:', mockPhotos.length);
      console.log('mockPhotos:', mockPhotos.map(p => ({ id: p.id, reportId: p.reportId })));
      
      reports = reports.map(r => {
        const reportPhotos = mockPhotos.filter(p => p.reportId === r.id);
        console.log(`Report ${r.id} photos:`, reportPhotos.length);
        
        // Look up actual user from mockUsers
        const reportUser = mockUsers.find((u: any) => u.id === r.userId);
        
        return {
          ...r,
          user: reportUser ? {
            id: reportUser.id,
            username: reportUser.username,
            firstName: reportUser.firstName,
            profileImageUrl: reportUser.profileImageUrl,
          } : {
            id: r.userId,
            username: 'unknown',
            firstName: 'Unknown',
            profileImageUrl: null,
          },
          trail: r.trailId ? { id: r.trailId, name: 'Mock Trail', parkId: '1' } : null,
          photos: reportPhotos,
          _count: { 
            votes: getVoteCount(r.id), 
            comments: getCommentCount(r.id) 
          },
        };
      });

      // Sort
      if (sortOrder === 'desc') {
        reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        reports.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      const total = reports.length;
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedReports = reports.slice(skip, skip + Number(limit));

      return res.json({
        success: true,
        data: {
          reports: paginatedReports,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)) || 1,
          },
        },
      });
    }
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
    });
  }
};

// Get single report
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try database first, fall back to mock
    try {
      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
              reputationPoints: true,
            },
          },
          trail: {
            select: {
              id: true,
              name: true,
              description: true,
              park: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          photos: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              caption: true,
              fileSizeBytes: true,
              width: true,
              height: true,
              aiClassification: true,
              aiConfidence: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      res.json({
        success: true,
        data: { report },
      });
    } catch (dbError) {
      // Mock mode fallback
      console.log('Using mock mode for getReport');
      
      const mockReport = mockReports.find((r: any) => r.id === id);
      
      if (!mockReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      // Get mock user
      const user = mockUsers.find((u: any) => u.id === mockReport.userId);
      
      // Get mock photos
      const photos = mockPhotos.filter((p: any) => p.reportId === id);

      res.json({
        success: true,
        data: { 
          report: {
            ...mockReport,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              reputationPoints: 0,
            } : null,
            trail: mockReport.trailId ? (() => {
              const trail = dbMockTrails.find((t: any) => t.id === mockReport.trailId);
              return trail ? {
                id: trail.id,
                name: trail.name,
                description: trail.description,
                park: { id: '1', name: 'Yosemite National Park' }
              } : { id: mockReport.trailId, name: 'Unknown Trail', description: null, park: { id: '1', name: 'Mock Park' } };
            })() : null,
            photos: photos,
            _count: {
              votes: getVoteCount(id),
              comments: getCommentCount(id),
            },
          }
        },
        message: 'Report fetched successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report',
    });
  }
};

// Create new report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      conditionType,
      severityLevel,
      description,
      location,
      affectedArea,
      trailId,
    } = req.body;

    // Try database first, fall back to mock
    try {
      const report = await prisma.report.create({
        data: {
          userId: req.user!.id,
          conditionType,
          severityLevel,
          description,
          location,
          affectedArea,
          trailId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              profileImageUrl: true,
            },
          },
          trail: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      });

      // Emit real-time event for database path too!
      emitReportCreated(report);

      res.status(201).json({
        success: true,
        data: { report },
        message: 'Report created successfully',
      });
    } catch (dbError) {
      // Database not available, use mock
      // Look up actual user from mockUsers for proper name
      const currentUser = mockUsers.find((u: any) => u.id === req.user!.id);
      
      const newReport = {
        id: generateUniqueId(),
        userId: req.user!.id,
        conditionType,
        severityLevel,
        description,
        location,
        affectedArea,
        trailId,
        isActive: true,
        isResolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          firstName: currentUser.firstName,
          profileImageUrl: currentUser.profileImageUrl,
        } : {
          id: req.user!.id,
          username: req.user!.username,
          firstName: req.user!.username,
          profileImageUrl: null,
        },
        trail: trailId ? { id: trailId, name: 'Mock Trail' } : null,
        _count: { votes: 0, comments: 0 },
      };

      addReport(newReport);

      // Send push notifications to nearby users (wrapped in try-catch to prevent crash)
      try {
        if (newReport.location?.coordinates) {
          const [lng, lat] = newReport.location.coordinates;
          const payload = NotificationTemplates.newHazardNearby(
            newReport.conditionType,
            'nearby'
          );
          payload.data = { 
            type: 'new-hazard', 
            reportId: newReport.id,
            coordinates: newReport.location.coordinates 
          };
          
          // Send to nearby users (2km radius, excluding creator)
          sendNotificationToNearbyUsers(lat, lng, 2, req.user!.id, payload)
            .then(sent => {
              if (sent > 0) {
                console.log(`Push notification sent to ${sent} nearby user(s)`);
              }
            })
            .catch(err => {
              console.error('Error sending push notifications:', err);
            });
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }

      // Emit real-time event (wrapped in try-catch to prevent crash)
      try {
        emitReportCreated(newReport);
      } catch (socketError) {
        console.error('Socket emit error:', socketError);
      }

      res.status(201).json({
        success: true,
        data: { report: newReport },
        message: 'Report created successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
    });
  }
};

// Update report
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { description, severityLevel, isResolved, resolutionNotes } = req.body;

    // Try database first, fall back to mock
    try {
      // Check if report exists and user has permission
      const existingReport = await prisma.report.findUnique({
        where: { id },
      });

      if (!existingReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      // Only allow user to update their own reports (unless admin/moderator)
      if (
        existingReport.userId !== req.user!.id &&
        !['ADMIN', 'MODERATOR'].includes(req.user!.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this report',
        });
      }

      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (severityLevel !== undefined) updateData.severityLevel = severityLevel;
      if (isResolved !== undefined) {
        updateData.isResolved = isResolved;
        if (isResolved) {
          updateData.resolvedAt = new Date();
          updateData.resolvedBy = req.user!.id;
        }
      }
      if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;

      const report = await prisma.report.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              profileImageUrl: true,
            },
          },
          trail: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Notify report owner about resolution (database mode)
      if (isResolved && existingReport.userId !== req.user!.id) {
        await notifyReportResolved(id, existingReport.userId, req.user!.id);
      }

      // Emit real-time event for database path too!
      emitReportUpdated(report);

      res.json({
        success: true,
        data: { report },
        message: 'Report updated successfully',
      });
    } catch (dbError) {
      // Mock mode fallback
      console.log('Using mock mode for updateReport');
      
      const mockReport = mockReports.find((r: any) => r.id === id);
      
      if (!mockReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      // Only allow user to update their own reports (unless admin/moderator)
      if (
        mockReport.userId !== req.user!.id &&
        !['ADMIN', 'MODERATOR'].includes(req.user!.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this report',
        });
      }

      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (severityLevel !== undefined) updateData.severityLevel = severityLevel;
      if (isResolved !== undefined) {
        updateData.isResolved = isResolved;
        if (isResolved) {
          updateData.resolvedAt = new Date().toISOString();
          updateData.resolvedBy = req.user!.id;
          
          // Notify report owner about resolution (mock mode)
          if (mockReport.userId !== req.user!.id) {
            await notifyReportResolved(id, mockReport.userId, req.user!.id);
          }
        }
      }
      if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;

      const updatedReport = updateReportInMock(id, updateData);
      
      // Get user and trail info for response
      const user = mockUsers.find((u: any) => u.id === updatedReport?.userId);

      const reportWithUser = {
        ...updatedReport,
        user: user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          profileImageUrl: user.profileImageUrl,
        } : null,
        trail: updatedReport?.trailId ? { id: updatedReport.trailId, name: 'Mock Trail' } : null,
      };

      // Emit real-time event
      emitReportUpdated(reportWithUser);

      res.json({
        success: true,
        data: { 
          report: reportWithUser
        },
        message: 'Report updated successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
    });
  }
};

// Delete report
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Only allow user to delete their own reports (unless admin)
    if (
      existingReport.userId !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this report',
      });
    }

    // Get trailId for socket emit
    const trailId = (existingReport as any).trailId;

    await prisma.report.delete({
      where: { id },
    });

    // Emit real-time event
    emitReportDeleted(id, trailId);

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
    });
  }
};

// Upload photo for report - S3 Integration
export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Use S3 if configured, otherwise save to local disk
    let photoUrl: string;
    let thumbnailUrl: string;
    let fileSize = req.file.size;
    let width = 0;
    let height = 0;
    
    const useS3 = process.env.USE_S3_STORAGE === 'true';
    
    if (useS3) {
      try {
        // Try S3 upload with timeout
        const s3Promise = uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.user!.id,
          {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 80,
            generateThumbnail: true,
          }
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('S3 upload timeout')), 5000)
        );
        
        const s3Result = await Promise.race([s3Promise, timeoutPromise]) as any;
        photoUrl = s3Result.url;
        thumbnailUrl = s3Result.thumbnailUrl || s3Result.url;
        fileSize = s3Result.fileSizeBytes;
        width = s3Result.width;
        height = s3Result.height;
        console.log('S3 upload successful:', photoUrl);
      } catch (s3Error) {
        console.log('S3 upload failed, falling back to local storage:', s3Error);
        // Fall through to local storage
      }
    }
    
    // Local storage fallback or default
    if (!photoUrl) {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `${Date.now()}_${req.file.originalname}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Write file to disk
      fs.writeFileSync(filepath, req.file.buffer);
      
      // Return relative URL for static file serving
      photoUrl = `/uploads/${filename}`;
      thumbnailUrl = photoUrl;
      console.log('Photo saved to local disk:', photoUrl);
    }

    // Try database first, fall back to mock
    let useMockMode = false;
    
    try {
      // Check if report exists
      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        // Report not in database, try mock mode
        useMockMode = true;
      } else {
        // Only allow user to add photos to their own reports
        if (report.userId !== req.user!.id) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to add photos to this report',
          });
        }

        // Create photo record with URL
        const photo = await prisma.photo.create({
          data: {
            reportId: id,
            userId: req.user!.id,
            url: photoUrl,
            thumbnailUrl: thumbnailUrl,
            fileSizeBytes: fileSize,
            width: width,
            height: height,
            mimeType: req.file.mimetype,
          },
        });

        return res.status(201).json({
          success: true,
          data: { photo },
          message: 'Photo uploaded successfully',
        });
      }
    } catch (dbError) {
      // Database not available, use mock mode
      console.log('Database error, using mock mode for photo upload:', dbError);
      useMockMode = true;
    }
    
    // Mock mode fallback
    if (useMockMode) {
      console.log('Using mock mode for photo upload, reportId:', id);
      
      // Check if report exists in mock
      const mockReport = mockReports.find(r => r.id === id);
      if (!mockReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      // Only allow user to add photos to their own reports
      if (mockReport.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to add photos to this report',
        });
      }

      // Create mock photo record with URL
      const photo = {
        id: `photo_${Date.now()}`,
        reportId: id,
        userId: req.user!.id,
        url: photoUrl,
        thumbnailUrl: thumbnailUrl,
        fileSizeBytes: fileSize,
        width: width,
        height: height,
        mimeType: req.file.mimetype,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to mockPhotos array
      mockPhotos.push(photo);
      console.log('Photo added to mockPhotos, total:', mockPhotos.length);
      
      // Also add to the report's photos array
      if (!mockReport.photos) {
        mockReport.photos = [];
      }
      mockReport.photos.push(photo);
      console.log('Photo added to report.photos, report now has:', mockReport.photos.length, 'photos');

      return res.status(201).json({
        success: true,
        data: { photo },
        message: 'Photo uploaded successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
    });
  }
};

// Upvote/verify a report
export const upvoteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Try database first, fall back to mock
    try {
      // Check if already voted
      const existingVote = await prisma.vote.findFirst({
        where: { userId, reportId: id },
      });

      if (existingVote) {
        return res.status(400).json({
          success: false,
          error: 'You have already verified this report',
        });
      }

      // Create vote
      const vote = await prisma.vote.create({
        data: {
          userId,
          reportId: id,
        },
      });

      // Get updated vote count
      const voteCount = await prisma.vote.count({
        where: { reportId: id },
      });

      // Emit real-time vote update
      emitVoteUpdated(id, voteCount);

      res.status(201).json({
        success: true,
        data: { vote, voteCount },
        message: 'Report verified successfully',
      });
    } catch (dbError) {
      // Mock mode
      if (hasUserVoted(userId, id)) {
        return res.status(400).json({
          success: false,
          error: 'You have already verified this report',
        });
      }

      const vote = {
        id: `vote_${Date.now()}`,
        userId,
        reportId: id,
        createdAt: new Date().toISOString(),
      };

      addVote(vote);
      const voteCount = getVoteCount(id);

      // Notify report owner about verification (mock mode)
      const report = mockReports.find((r: any) => r.id === id);
      if (report && report.userId !== userId) {
        await notifyReportVerified(id, report.userId, userId);
      }

      // Emit real-time vote update
      emitVoteUpdated(id, voteCount);

      res.status(201).json({
        success: true,
        data: { vote, voteCount },
        message: 'Report verified successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify report',
    });
  }
};

// Remove upvote from a report
export const removeUpvote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Try database first, fall back to mock
    try {
      await prisma.vote.deleteMany({
        where: { userId, reportId: id },
      });

      const voteCount = await prisma.vote.count({
        where: { reportId: id },
      });

      res.json({
        success: true,
        data: { voteCount },
        message: 'Verification removed',
      });
    } catch (dbError) {
      // Mock mode
      removeVote(userId, id);
      const voteCount = getVoteCount(id);

      res.json({
        success: true,
        data: { voteCount },
        message: 'Verification removed (mock)',
      });
    }
  } catch (error) {
    console.error('Remove upvote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove verification',
    });
  }
};

// Get comments for a report
export const getReportComments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try database first, fall back to mock
    try {
      const comments = await prisma.comment.findMany({
        where: { reportId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: { comments },
      });
    } catch (dbError) {
      // Mock mode
      const comments = getComments(id).map((c: any) => {
        const user = mockUsers.find((u: any) => u.id === c.userId);
        return {
          ...c,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          } : null,
        };
      });

      res.json({
        success: true,
        data: { comments },
        message: 'Comments retrieved (mock)',
      });
    }
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve comments',
    });
  }
};

// Add comment to a report
export const addReportComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    // Try database first, fall back to mock
    try {
      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          reportId: id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      });

      // Emit real-time comment event
      emitCommentAdded(id, comment);

      // Notify report owner about the comment
      const report = await prisma.report.findUnique({
        where: { id },
        select: { userId: true },
      });
      console.log('Comment created - checking notification trigger:', { reportId: id, commentId: comment.id, commentAuthorId: userId, reportOwnerId: report?.userId });
      if (report && report.userId !== userId) {
        console.log('Triggering notification for comment');
        await notifyReportCommented(id, comment.id, userId, report.userId);
      }

      res.status(201).json({
        success: true,
        data: { comment },
        message: 'Comment added successfully',
      });
    } catch (dbError) {
      // Mock mode
      const comment = {
        id: `comment_${Date.now()}`,
        content: content.trim(),
        reportId: id,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addComment(comment);

      const user = mockUsers.find((u: any) => u.id === userId);

      // Emit real-time comment event (mock mode)
      const commentWithUser = {
        ...comment,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
        } : null,
      };
      emitCommentAdded(id, commentWithUser);

      // Notify report owner about the comment (mock mode)
      const report = mockReports.find((r: any) => r.id === id);
      console.log('Mock comment created - checking notification trigger:', { reportId: id, commentId: comment.id, commentAuthorId: userId, reportOwnerId: report?.userId });
      if (report && report.userId !== userId) {
        console.log('Triggering mock notification for comment');
        await notifyReportCommented(id, comment.id, userId, report.userId);
      }

      res.status(201).json({
        success: true,
        data: {
          comment: {
            ...comment,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
            } : null,
          },
        },
        message: 'Comment added successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
};

// Update comment
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    // Try database first, fall back to mock
    try {
      // Check if comment exists and belongs to user
      const existingComment = await prisma.comment.findFirst({
        where: { id: commentId, reportId: id },
      });

      if (!existingComment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own comments',
        });
      }

      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: content.trim(),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: { comment },
        message: 'Comment updated successfully',
      });
    } catch (dbError) {
      // Mock mode
      const mockComments = getComments(id);
      const commentIndex = mockComments.findIndex((c: any) => c.id === commentId);
      
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      if (mockComments[commentIndex].userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own comments',
        });
      }

      // Update the comment
      mockComments[commentIndex].content = content.trim();
      mockComments[commentIndex].updatedAt = new Date().toISOString();

      const user = mockUsers.find((u: any) => u.id === userId);

      res.json({
        success: true,
        data: {
          comment: {
            ...mockComments[commentIndex],
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
            } : null,
          },
        },
        message: 'Comment updated successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
    });
  }
};

// Delete comment
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user!.id;

    // Try database first, fall back to mock
    try {
      // Check if comment exists and belongs to user
      const existingComment = await prisma.comment.findFirst({
        where: { id: commentId, reportId: id },
      });

      if (!existingComment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
        });
      }

      await prisma.comment.delete({
        where: { id: commentId },
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (dbError) {
      // Mock mode
      const mockComments = getComments(id);
      const commentIndex = mockComments.findIndex((c: any) => c.id === commentId);
      
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      if (mockComments[commentIndex].userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
        });
      }

      // Remove the comment using the delete function
      deleteCommentFromDb(commentId, userId);

      res.json({
        success: true,
        message: 'Comment deleted successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
};
