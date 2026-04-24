import { Router } from 'express';
import { classifyHazard, batchClassifyHazards } from '@/services/aiClassification';

const router = Router();

/**
 * Classify a single hazard
 */
router.post('/classify', (req, res) => {
  try {
    const { description, hazardType } = req.body;

    if (!description || !hazardType) {
      return res.status(400).json({
        success: false,
        error: 'Description and hazard type are required'
      });
    }

    const classification = classifyHazard(description, hazardType);

    res.json({
      success: true,
      data: classification
    });
  } catch (error) {
    console.error('Error classifying hazard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify hazard'
    });
  }
});

/**
 * Batch classify multiple hazards
 */
router.post('/batch-classify', (req, res) => {
  try {
    const { reports } = req.body;

    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({
        success: false,
        error: 'Reports array is required'
      });
    }

    const classifications = batchClassifyHazards(reports);

    res.json({
      success: true,
      data: {
        classifications,
        total: classifications.length
      }
    });
  } catch (error) {
    console.error('Error batch classifying hazards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch classify hazards'
    });
  }
});

export default router;
