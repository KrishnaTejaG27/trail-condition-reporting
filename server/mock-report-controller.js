// Mock report storage
let reports = [];
let reportIdCounter = 1;

// Mock create report endpoint
const createReport = async (req, res) => {
  try {
    const { conditionType, severityLevel, description, location, trailId } = req.body;

    console.log('Mock Create Report attempt:', { conditionType, severityLevel });

    const report = {
      id: `report_${reportIdCounter++}`,
      userId: 'user_1', // Mock user ID
      conditionType,
      severityLevel,
      description,
      location,
      trailId,
      isResolved: false,
      isVerified: false,
      verificationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      user: {
        id: 'user_1',
        username: 'testuser',
        firstName: 'Test',
        profileImageUrl: null
      },
      photos: [],
      _count: {
        votes: 0,
        comments: 0
      }
    };

    reports.push(report);
    console.log('Report created successfully:', report.id);

    res.status(201).json({
      success: true,
      data: { report },
      message: 'Report created successfully',
    });
  } catch (error) {
    console.error('Mock Create Report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      details: error.message,
    });
  }
};

// Mock get reports endpoint
const getReports = async (req, res) => {
  try {
    console.log('Mock Get Reports attempt');

    res.json({
      success: true,
      data: {
        reports: reports,
        pagination: {
          page: 1,
          limit: 20,
          total: reports.length,
          pages: Math.ceil(reports.length / 20),
        },
      },
    });
  } catch (error) {
    console.error('Mock Get Reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
      details: error.message,
    });
  }
};

// Mock get single report endpoint
const getReport = async (req, res) => {
  try {
    const id = req.url.split('/').pop();
    console.log('Mock Get Report attempt:', id);

    const report = reports.find(r => r.id === id);
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
    console.error('Mock Get Report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report',
      details: error.message,
    });
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  reports // Export for testing
};
