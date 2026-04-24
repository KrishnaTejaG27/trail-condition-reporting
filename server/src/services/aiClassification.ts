/**
 * AI-based Hazard Classification Service
 * Uses keyword analysis and pattern matching to classify hazard severity
 */

interface ClassificationResult {
  suggestedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  reasoning: string;
}

// Keywords for each severity level
const severityKeywords = {
  CRITICAL: [
    'blocked', 'impassable', 'closed', 'dangerous', 'life-threatening',
    'injury', 'emergency', 'flood', 'deep water', 'washout', 'collapsed',
    'falling rocks', 'landslide', 'avalanche', 'extreme', 'severe'
  ],
  HIGH: [
    'slippery', 'mud', 'ice', 'snow', 'deep', 'difficult', 'steep',
    'unstable', 'rockfall', 'hazardous', 'warning', 'caution', 'heavy',
    'large', 'significant', 'major', 'serious'
  ],
  MEDIUM: [
    'wet', 'damp', 'muddy', 'rough', 'uneven', 'rocky', 'rooty',
    'narrow', 'overgrown', 'brush', 'moderate', 'some', 'minor',
    'small', 'light', 'partial'
  ],
  LOW: [
    'dry', 'clear', 'good', 'fine', 'ok', 'okay', 'minor', 'slight',
    'easy', 'flat', 'smooth', 'well-maintained', 'accessible'
  ]
};

// Hazard type severity weights
const hazardTypeWeights: Record<string, number> = {
  'flooding': 0.9,
  'ice': 0.85,
  'closed_trail': 0.95,
  'fallen_tree': 0.7,
  'mud': 0.5,
  'other': 0.3
};

/**
 * Classify hazard based on description and type
 */
export const classifyHazard = (
  description: string,
  hazardType: string
): ClassificationResult => {
  const desc = description.toLowerCase();
  let scores = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  // Score based on keywords
  for (const [severity, keywords] of Object.entries(severityKeywords)) {
    keywords.forEach(keyword => {
      if (desc.includes(keyword)) {
        scores[severity as keyof typeof scores] += 1;
      }
    });
  }

  // Add hazard type weight
  const typeWeight = hazardTypeWeights[hazardType] || 0.5;
  if (typeWeight >= 0.8) {
    scores.CRITICAL += 2;
    scores.HIGH += 1;
  } else if (typeWeight >= 0.6) {
    scores.HIGH += 2;
    scores.MEDIUM += 1;
  } else if (typeWeight >= 0.4) {
    scores.MEDIUM += 2;
    scores.LOW += 1;
  } else {
    scores.LOW += 2;
  }

  // Determine highest score
  let maxScore = 0;
  let suggestedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  for (const [severity, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      suggestedSeverity = severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }
  }

  // Calculate confidence based on score difference
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? (maxScore / totalScore) * 100 : 50;

  // Generate reasoning
  const reasoning = generateReasoning(suggestedSeverity, scores, hazardType);

  return {
    suggestedSeverity,
    confidence: Math.min(confidence, 100),
    reasoning
  };
};

/**
 * Generate human-readable reasoning for classification
 */
function generateReasoning(
  severity: string,
  scores: Record<string, number>,
  hazardType: string
): string {
  const reasons: string[] = [];

  if (scores[severity] > 0) {
    reasons.push(`Matched ${scores[severity]} severity indicators`);
  }

  if (hazardTypeWeights[hazardType] >= 0.8) {
    reasons.push('High-risk hazard type detected');
  } else if (hazardTypeWeights[hazardType] >= 0.5) {
    reasons.push('Moderate-risk hazard type detected');
  }

  if (reasons.length === 0) {
    return 'Based on hazard type and general assessment';
  }

  return reasons.join('. ');
}

/**
 * Batch classify multiple reports
 */
export const batchClassifyHazards = (
  reports: Array<{ description: string; hazardType: string }>
): Array<{ classification: ClassificationResult; originalIndex: number }> => {
  return reports.map((report, index) => ({
    classification: classifyHazard(report.description, report.hazardType),
    originalIndex: index
  }));
};
