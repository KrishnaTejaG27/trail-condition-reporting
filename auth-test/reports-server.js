const http = require('http');

// Mock reports storage
let reports = [];
let reportIdCounter = 1;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and method
  const url = req.url;
  const method = req.method;

  // Get all reports
  if (url === '/api/reports' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
  }
  // Create report
  else if (url === '/api/reports' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const reportData = JSON.parse(body);
        console.log('Report creation attempt:', reportData);
        
        const report = {
          id: `report_${reportIdCounter++}`,
          userId: 'user_1',
          conditionType: reportData.conditionType,
          severityLevel: reportData.severityLevel,
          description: reportData.description,
          location: reportData.location,
          trailId: reportData.trailId,
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
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: { report },
          message: 'Report created successfully',
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Failed to create report',
          details: error.message,
        }));
      }
    });
  }
  // Get single report
  else if (url.startsWith('/api/reports/') && method === 'GET') {
    const id = url.split('/').pop();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Report not found',
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: { report },
      }));
    }
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
    }));
  }
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`🚀 Mock Reports Server running on port ${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/reports`);
  console.log(`   POST http://localhost:${PORT}/api/reports`);
  console.log(`   GET  http://localhost:${PORT}/api/reports/:id`);
});
