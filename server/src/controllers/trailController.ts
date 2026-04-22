import { Request, Response } from 'express';
import { prisma } from '@/index';

// Get all trails (with optional filtering)
export const getTrails = async (req: Request, res: Response) => {
  try {
    // Return mock trails for demo when no database
    const mockTrails = [
      {
        id: 'trail_1',
        name: 'Mist Trail',
        description: 'Steep trail leading to Vernal Fall',
        park: { name: 'Yosemite National Park' },
        _count: { reports: 2 }
      },
      {
        id: 'trail_2',
        name: 'Mirror Lake Loop',
        description: 'Easy loop around Mirror Lake',
        park: { name: 'Yosemite National Park' },
        _count: { reports: 0 }
      },
      {
        id: 'trail_3',
        name: 'Half Dome Trail',
        description: 'Challenging trail to Half Dome summit',
        park: { name: 'Yosemite National Park' },
        _count: { reports: 5 }
      },
      {
        id: 'trail_4',
        name: 'Lower Yosemite Fall Trail',
        description: 'Paved trail to the base of Lower Yosemite Fall',
        park: { name: 'Yosemite National Park' },
        _count: { reports: 1 }
      },
      {
        id: 'trail_5',
        name: 'Sentinel Dome Trail',
        description: 'Short hike to panoramic views',
        park: { name: 'Yosemite National Park' },
        _count: { reports: 0 }
      }
    ];

    res.json({
      success: true,
      data: { trails: mockTrails },
    });
  } catch (error) {
    console.error('Get trails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trails',
    });
  }
};

// Get single trail by ID
export const getTrail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trail = await prisma.trail.findUnique({
      where: { id },
      include: {
        park: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        reports: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            conditionType: true,
            severityLevel: true,
            description: true,
            createdAt: true,
            isResolved: true,
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!trail) {
      return res.status(404).json({
        success: false,
        error: 'Trail not found',
      });
    }

    res.json({
      success: true,
      data: { trail },
    });
  } catch (error) {
    console.error('Get trail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trail',
    });
  }
};

// Get trails near a location (simplified - returns all active trails for now)
export const getNearbyTrails = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    // For now, return all active trails
    // In production, you'd use PostGIS for geospatial queries
    const trails = await prisma.trail.findMany({
      where: { isActive: true },
      include: {
        park: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: { trails },
    });
  } catch (error) {
    console.error('Get nearby trails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby trails',
    });
  }
};

// Seed some sample trails if none exist
export const seedTrails = async () => {
  try {
    const count = await prisma.trail.count();
    if (count === 0) {
      // Create a default park first
      const park = await prisma.park.create({
        data: {
          name: 'Yosemite National Park',
          description: 'Famous for its giant sequoia trees and granite cliffs',
        },
      });

      // Create sample trails
      await prisma.trail.createMany({
        data: [
          {
            name: 'Mist Trail',
            parkId: park.id,
            description: 'Steep trail leading to Vernal Fall',
            difficultyLevel: 2.5,
            lengthKm: 4.8,
            estimatedDurationMin: 180,
          },
          {
            name: 'Mirror Lake Loop',
            parkId: park.id,
            description: 'Easy loop around Mirror Lake',
            difficultyLevel: 1.0,
            lengthKm: 3.2,
            estimatedDurationMin: 90,
          },
          {
            name: 'Half Dome Trail',
            parkId: park.id,
            description: 'Challenging trail to Half Dome summit',
            difficultyLevel: 4.5,
            lengthKm: 27.4,
            estimatedDurationMin: 600,
          },
          {
            name: 'Lower Yosemite Fall Trail',
            parkId: park.id,
            description: 'Paved trail to the base of Lower Yosemite Fall',
            difficultyLevel: 1.0,
            lengthKm: 1.6,
            estimatedDurationMin: 30,
          },
          {
            name: 'Sentinel Dome Trail',
            parkId: park.id,
            description: 'Short hike to panoramic views',
            difficultyLevel: 2.0,
            lengthKm: 3.2,
            estimatedDurationMin: 120,
          },
        ],
      });

      console.log('✅ Sample trails seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding trails:', error);
  }
};
