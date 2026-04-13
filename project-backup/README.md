# Trail Safety Platform

A SaaS platform for real-time trail condition and safety reporting for hikers, runners, and park visitors.

## Project Overview

**Niche**: Hikers, runners, park visitors  
**Problem**: Trail conditions (mud, flooding, closures, fallen trees) are not updated in real time  
**Solution**: A platform where users can report and view live trail conditions

## Core Features

- User accounts and authentication
- Map integration (Leaflet / Mapbox)
- Geo-tagged condition reports
- Photo upload functionality
- "Upvote to confirm" system for reports
- Admin moderation panel
- Live condition maps
- Safety alerts

## Nice-to-Have Features

- AI image classification (detect fallen trees, snow, etc.)
- Heat map of most reported hazards
- Weather API integration

## Development Phases

### Phase 1: Foundation ✅
- [x] Problem validation
- [x] PRD writing
- [x] Wireframes
- [x] DB schema design

### Phase 2: Core Development ✅
- [x] Authentication
- [x] Core CRUD operations

### Phase 3: Dashboard & Logic 🔄
- [ ] Dashboard development
- [ ] Business logic implementation
- [ ] Role management

### Phase 4: Advanced Features
- [ ] AI integrations
- [ ] Email/notifications
- [ ] UX polishing

### Phase 5: Launch
- [ ] Deployment
- [ ] Demo day
- [ ] Revenue model presentation

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: Leaflet / Mapbox
- **Authentication**: JWT
- **File Storage**: Cloudinary / AWS S3
- **Deployment**: Vercel (frontend), Railway (backend)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Team Structure

- Project Manager
- Frontend Developer
- Backend Developer
- UI/UX Designer
- DevOps Engineer
