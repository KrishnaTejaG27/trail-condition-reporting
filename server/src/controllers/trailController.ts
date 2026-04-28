import { Request, Response } from 'express';
import { prisma } from '@/index';
import { mockReports as dbMockReports } from '@/mockDb';

// Local mock trails for fallback
export const dbMockTrails = [
  {
    id: 'trail_1',
    name: 'Mist Trail',
    description: 'Steep trail leading to Vernal Fall',
    difficulty: 'HARD',
    length: 3.0,
    location: 'Yosemite Valley',
    elevationGain: 1000,
    estimatedTime: '3-4 hours',
    features: ['Waterfall', 'Stairs', 'River crossing'],
    surfaceTypes: ['Dirt', 'Rock'],
    status: 'OPEN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trail_2',
    name: 'Valley Loop Trail',
    description: 'Easy loop around Yosemite Valley floor',
    difficulty: 'EASY',
    length: 7.2,
    location: 'Yosemite Valley',
    elevationGain: 50,
    estimatedTime: '2-4 hours',
    features: ['Views', 'Wildlife', 'Flat'],
    surfaceTypes: ['Paved', 'Dirt'],
    status: 'OPEN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trail_3',
    name: 'Mirror Lake Loop',
    description: 'Peaceful walk to seasonal Mirror Lake',
    difficulty: 'EASY',
    length: 2.0,
    location: 'Tenaya Creek',
    elevationGain: 100,
    estimatedTime: '1-2 hours',
    features: ['Lake views', 'Reflection', 'Nature'],
    surfaceTypes: ['Paved', 'Dirt'],
    status: 'OPEN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trail_4',
    name: 'Sentinel Dome Trail',
    description: 'Short hike to panoramic dome views',
    difficulty: 'MODERATE',
    length: 2.2,
    location: 'Glacier Point Road',
    elevationGain: 400,
    estimatedTime: '1-2 hours',
    features: ['360° Views', 'Granite dome', 'Sunset'],
    surfaceTypes: ['Dirt', 'Granite'],
    status: 'OPEN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Get all trails (with optional filtering)
export const getTrails = async (req: Request, res: Response) => {
  try {
    // Return mock trails for demo when no database - map from module-level dbMockTrails
    const mockTrails = dbMockTrails.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      park: { name: 'Yosemite National Park' },
      _count: { 
        reports: dbMockReports.filter((r: any) => r.trailId === t.id && r.isActive).length 
      }
    }));

    return res.json({
      success: true,
      data: { trails: mockTrails }
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
    
    // Try mock data fallback
    try {
      const mockTrail = dbMockTrails.find((t: any) => t.id === req.params.id);
      if (mockTrail) {
        // Get mock reports for this trail
        const trailReports = dbMockReports
          .filter((r: any) => r.trailId === mockTrail.id && r.isActive)
          .slice(0, 5)
          .map((r: any) => ({
            id: r.id,
            conditionType: r.conditionType,
            severityLevel: r.severityLevel,
            description: r.description,
            isResolved: r.isResolved,
            createdAt: r.createdAt,
          }));
          
        return res.json({
          success: true,
          data: { 
            trail: {
              ...mockTrail,
              reports: trailReports,
              _count: { reports: trailReports.length }
            }
          },
          message: 'Trail retrieved (mock)'
        });
      }
    } catch (mockError) {
      console.log('Mock fallback failed for getTrail');
    }
    
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
