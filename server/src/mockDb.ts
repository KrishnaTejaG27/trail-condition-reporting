// Temporary in-memory mock database for testing without PostgreSQL
export const mockUsers: any[] = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$YourHashedPasswordHere', // "password" hashed
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$10$YourHashedPasswordHere',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const mockReports: any[] = [
  {
    id: '1',
    conditionType: 'TRAIL_BLOCKED',
    severityLevel: 'HIGH',
    description: 'Large tree blocking the main trail about 1 mile from the parking lot.',
    location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    isActive: true,
    isResolved: false,
    userId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    conditionType: 'FLOOD_DAMAGE',
    severityLevel: 'CRITICAL',
    description: 'Trail washed out near the creek crossing. Use caution.',
    location: { type: 'Point', coordinates: [-122.4180, 37.7750] },
    isActive: true,
    isResolved: false,
    userId: '1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    conditionType: 'WILDLIFE_ACTIVITY',
    severityLevel: 'MEDIUM',
    description: 'Bear sighting reported in the area. Make noise while hiking.',
    location: { type: 'Point', coordinates: [-122.4200, 37.7760] },
    isActive: true,
    isResolved: false,
    userId: '2',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  }
];

export const mockPhotos: any[] = [];
