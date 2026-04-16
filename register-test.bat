@echo off
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"TestPass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
