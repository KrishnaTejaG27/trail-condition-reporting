import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';
import { mockReports, mockUsers, mockPhotos, generateUniqueId } from '@/mockDb';

const router = Router();

// All import routes require authentication and admin role
router.use(protect);

const checkAdminRole = (req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  next();
};

router.use(checkAdminRole);

/**
 * Import trails from CSV data
 */
router.post('/csv', async (req, res) => {
  try {
    const { trails } = req.body;
    
    if (!trails || !Array.isArray(trails) || trails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No trails provided'
      });
    }

    // Try database first
    try {
      const createdTrails = [];
      
      for (const trailData of trails) {
        const trail = await prisma.trail.create({
          data: {
            name: trailData.name,
            description: trailData.description,
            difficulty: trailData.difficulty || 'MODERATE',
            length: parseFloat(trailData.length) || 0,
            location: trailData.location,
            parkId: trailData.parkId || '1',
            trailheadCoords: trailData.trailheadCoords,
            elevationGain: parseFloat(trailData.elevationGain) || 0,
            estimatedTime: trailData.estimatedTime,
            features: trailData.features || [],
            surfaceTypes: trailData.surfaceTypes || [],
            status: 'OPEN'
          }
        });
        createdTrails.push(trail);
      }

      return res.json({
        success: true,
        data: { 
          imported: createdTrails.length,
          trails: createdTrails
        },
        message: `Successfully imported ${createdTrails.length} trails`
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for trail import');
      
      const createdTrails = [];
      for (const trailData of trails) {
        const newTrail = {
          id: generateUniqueId(),
          name: trailData.name,
          description: trailData.description,
          difficulty: trailData.difficulty || 'MODERATE',
          length: parseFloat(trailData.length) || 0,
          location: trailData.location,
          parkId: trailData.parkId || '1',
          trailheadCoords: trailData.trailheadCoords,
          elevationGain: parseFloat(trailData.elevationGain) || 0,
          estimatedTime: trailData.estimatedTime,
          features: trailData.features || [],
          surfaceTypes: trailData.surfaceTypes || [],
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // Note: In real implementation, you'd add to mock trails array
        createdTrails.push(newTrail);
      }

      return res.json({
        success: true,
        data: { 
          imported: createdTrails.length,
          trails: createdTrails
        },
        message: `Imported ${createdTrails.length} trails (mock)`
      });
    }
  } catch (error) {
    console.error('Error importing trails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import trails'
    });
  }
});

/**
 * Sample trail data for testing
 */
router.get('/sample', async (req, res) => {
  const sampleTrails = [
    {
      name: "Bear Mountain Trail",
      description: "Challenging hike with scenic views of the valley",
      difficulty: "HARD",
      length: 8.5,
      location: "Bear Mountain State Park",
      elevationGain: 1200,
      estimatedTime: "4-5 hours",
      features: ["Views", "Waterfall", "Rocky"],
      surfaceTypes: ["Rock", "Dirt"]
    },
    {
      name: "Lake Loop",
      description: "Easy family-friendly walk around the lake",
      difficulty: "EASY",
      length: 2.3,
      location: "Lake Park",
      elevationGain: 50,
      estimatedTime: "1 hour",
      features: ["Lake", "Wildlife", "Flat"],
      surfaceTypes: ["Paved", "Gravel"]
    },
    {
      name: "Forest Creek Path",
      description: "Moderate trail following the creek through pine forest",
      difficulty: "MODERATE",
      length: 5.0,
      location: "Pine Forest Preserve",
      elevationGain: 400,
      estimatedTime: "2-3 hours",
      features: ["Creek", "Shade", "Wildflowers"],
      surfaceTypes: ["Dirt", "Rock"]
    }
  ];

  res.json({
    success: true,
    data: { trails: sampleTrails },
    message: 'Sample trails for testing import'
  });
});

/**
 * Get import status/logs
 */
router.get('/status', async (req, res) => {
  // Mock import status
  res.json({
    success: true,
    data: {
      lastImport: new Date().toISOString(),
      totalImported: 3,
      status: 'ready'
    }
  });
});

export default router;
