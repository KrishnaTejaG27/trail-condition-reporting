# TrailWatch 🥾

Real-time, community-driven trail condition and safety platform for hikers, runners, and outdoor enthusiasts.

## Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+ with PostGIS extension)
- Mapbox account (free tier)

### Database Setup
```sql
-- Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create database
CREATE DATABASE trailwatch;
```

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

npm install
npm run dev
```

Server runs on http://localhost:3001

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Add your Mapbox token

npm install
npm run dev
```

App runs on http://localhost:3000

### Seed Chicago Trails
```bash
# After server is running
curl -X POST http://localhost:3001/api/seed/trails
```

## Features

- **Interactive Map** - Real-time trail and hazard visualization
- **≤10 Second Reporting** - Quick hazard submission with photo capture
- **Trust System** - Voting-based confidence scoring
- **Auto-Expiration** - Time-aware data freshness
- **Safety Alerts** - High-confidence hazard notifications
- **Photo Validation** - Image-based credibility boost

## Tech Stack

- **Frontend:** React 18 + Vite + Mapbox GL
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + PostGIS
- **Auth:** JWT
- **Storage:** Local filesystem (MVP), AWS S3 ready

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/trails` - Get nearby trails
- `GET /api/reports` - Get nearby reports
- `POST /api/reports` - Create report
- `POST /api/reports/:id/vote` - Vote on report
- `GET /api/alerts` - Get safety alerts

## License

MIT
