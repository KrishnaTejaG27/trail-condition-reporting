import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest } from '@/middleware/auth';

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

    res.json({
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

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
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
        comments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
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

    res.status(201).json({
      success: true,
      data: { report },
      message: 'Report created successfully',
    });
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

    res.json({
      success: true,
      data: { report },
      message: 'Report updated successfully',
    });
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

    await prisma.report.delete({
      where: { id },
    });

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

// Upload photo for report
export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Only allow user to add photos to their own reports
    if (report.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add photos to this report',
      });
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        reportId: id,
        userId: req.user!.id,
        url: `/uploads/${req.file.filename}`,
        thumbnailUrl: `/uploads/${req.file.filename}`,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json({
      success: true,
      data: { photo },
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
    });
  }
};
