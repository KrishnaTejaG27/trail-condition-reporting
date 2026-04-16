#!/bin/bash

echo "Testing login with working credentials..."
echo ""

# Test the working login endpoint
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

echo ""
echo "✅ If you see success response above, login is working!"
echo "🌐 Now go to: http://localhost:5173"
echo "📧 Use credentials: test@example.com / TestPass123"
