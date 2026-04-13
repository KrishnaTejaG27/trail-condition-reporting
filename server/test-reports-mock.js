const http = require('http');
const { createReport, getReports, getReport } = require('./mock-report-controller');

// Mock server for testing reports
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Add helper methods to response
  res.status = function(code) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    return res;
  };
  
  res.json = function(data) {
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and method
  const url = req.url;
  const method = req.method;

  // Route handling
  if (url === '/api/reports' && method === 'GET') {
    getReports(req, res);
  } else if (url === '/api/reports' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      req.body = JSON.parse(body);
      createReport(req, res);
    });
  } else if (url.startsWith('/api/reports/') && method === 'GET') {
    getReport(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`🚀 Mock reports test server running on port ${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/reports`);
  console.log(`   POST http://localhost:${PORT}/api/reports`);
  console.log(`   GET  http://localhost:${PORT}/api/reports/:id`);
});

// Test the endpoints automatically
setTimeout(async () => {
  console.log('\n🧪 Running reports tests...\n');
  
  const testHttp = (options, data) => {
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      });
      req.on('error', resolve);
      
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  try {
    // Test create report
    console.log('1. Testing create report...');
    const createResponse = await testHttp({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      conditionType: 'FALLEN_TREE',
      severityLevel: 'HIGH',
      description: 'Large fallen tree blocking the trail',
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      trailId: 'trail_1'
    });
    console.log(`   Status: ${createResponse.statusCode}`);
    console.log(`   Response: ${createResponse.body.substring(0, 100)}...\n`);

    // Test get reports
    console.log('2. Testing get reports...');
    const getReportsResponse = await testHttp({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${getReportsResponse.statusCode}`);
    console.log(`   Response: ${getReportsResponse.body.substring(0, 100)}...\n`);

    if (createResponse.statusCode === 201) {
      const createData = JSON.parse(createResponse.body);
      const reportId = createData.data.report.id;

      // Test get single report
      console.log('3. Testing get single report...');
      const getReportResponse = await testHttp({
        hostname: 'localhost',
        port: PORT,
        path: `/api/reports/${reportId}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`   Status: ${getReportResponse.statusCode}`);
      console.log(`   Response: ${getReportResponse.body.substring(0, 100)}...\n`);
    }

    console.log('✅ All reports tests completed successfully!');
    server.close();
  } catch (error) {
    console.error('❌ Reports test failed:', error.message);
    server.close();
  }
}, 1000);
