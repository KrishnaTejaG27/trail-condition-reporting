# Development Setup Guide

## Prerequisites

Before setting up the Trail Safety Platform, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (v14 or higher)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd trail-safety-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

#### Server Environment

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/trail_safety_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# Cloudinary (for photo uploads)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Email (for notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Mapbox (for maps)
MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"

# Weather API
WEATHER_API_KEY="your-weather-api-key"
```

#### Client Environment

1. Copy the example environment file:
```bash
cd client
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```env
VITE_API_URL="http://localhost:3001"
VITE_MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"
VITE_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
```

### 4. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE trail_safety_db;
```

2. Generate Prisma client:
```bash
cd server
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma migrate dev --name init
```

4. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

### 5. Start Development Servers

#### Method 1: Using Root Package Scripts

From the root directory:
```bash
npm run dev
```

This will start both the server and client concurrently.

#### Method 2: Separate Terminals

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)

## External Service Setup

### Cloudinary (for Photo Uploads)

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Create a new account and get your:
   - Cloud name
   - API Key
   - API Secret
3. Add these to your `.env` file

### Mapbox (for Maps)

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Create a new access token with public scope
3. Add the token to your `.env` file

### Email Service (for Notifications)

#### Gmail Setup:

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password in your `.env` file

#### Alternative: Use a transactional email service like:
- SendGrid
- Mailgun
- AWS SES

### Weather API

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api) or similar
2. Get your API key
3. Add it to your `.env` file

## Development Tools

### Database Management

```bash
# View database in browser
npm run db:studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run client tests only
cd client && npm test

# Run server tests only
cd server && npm test
```

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Lint client only
cd client && npm run lint

# Lint server only
cd server && npm run lint
```

## Project Structure

```
trail-safety-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── docs/                   # Documentation
├── package.json            # Root package.json
└── README.md
```

## Common Issues and Solutions

### Database Connection Issues

1. **Connection refused**: Make sure PostgreSQL is running
2. **Authentication failed**: Check your database credentials in `.env`
3. **Database doesn't exist**: Create the database manually

### Port Conflicts

- Default ports: 3001 (server), 5173 (client)
- If ports are in use, you can change them in the respective `.env` files

### CORS Issues

Make sure `FRONTEND_URL` in your server `.env` matches your client URL exactly.

### Build Errors

1. **TypeScript errors**: Check `tsconfig.json` settings
2. **Missing dependencies**: Run `npm install` in the affected directory
3. **Environment variables**: Ensure all required variables are set

## Production Deployment

### Environment Variables for Production

Create `.env.production` files with production-specific values:

- Use production database URLs
- Use production API keys
- Set `NODE_ENV=production`
- Use HTTPS URLs

### Build Commands

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Contributing Guidelines

1. **Branch Naming**: Use `feature/feature-name` or `fix/bug-name`
2. **Commits**: Follow conventional commit format
3. **Pull Requests**: Provide clear descriptions and test coverage
4. **Code Style**: Follow ESLint and Prettier configurations

## Getting Help

- Check the [documentation](./docs/)
- Review existing issues in the project repository
- Contact the development team for specific questions

## Next Steps

Once your development environment is set up:

1. Review the [PRD](./PRD.md) to understand the project requirements
2. Study the [database schema](./database-schema.md)
3. Review the [wireframes](./wireframes.md) for UI design
4. Start with Phase 2: Authentication and Core CRUD development

Happy coding! 🚀
