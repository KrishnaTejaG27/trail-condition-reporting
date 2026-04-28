// File-based mock database for persistence across server restarts
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'mock-data.json');

// Default data - only users, no reports
const defaultData = {
  users: [
    {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
      passwordHash: '$2a$10$YourHashedPasswordHere',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
      reputationPoints: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      passwordHash: '$2a$10$YourHashedPasswordHere',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      reputationPoints: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  reports: [],
  photos: [],
  votes: [],
  comments: [],
  pushSubscriptions: []
};

// Load data from file or create default
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(rawData);
      const reports = loaded.reports || defaultData.reports;
      // Ensure all arrays exist and calculate reputation points
      const users = (loaded.users || defaultData.users).map((user: any) => {
        const userReports = reports.filter((r: any) => r.userId === user.id);
        const calculatedPoints = userReports.length * 10; // 10 points per report
        return {
          ...user,
          reputationPoints: user.reputationPoints || calculatedPoints || 0
        };
      });
      return {
        users,
        reports,
        photos: loaded.photos || defaultData.photos,
        votes: loaded.votes || [],
        comments: loaded.comments || [],
        pushSubscriptions: loaded.pushSubscriptions || [],
      };
    }
  } catch (error) {
    console.log('Error loading mock data file, using defaults');
  }
  return { ...defaultData, votes: [], comments: [], pushSubscriptions: [] };
}

// Save data to file
function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving mock data:', error);
  }
}

// Initialize data
let data = loadData();

// Export arrays that sync to file
export const mockUsers = new Proxy(data.users, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

export const mockReports = new Proxy(data.reports, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

export const mockPhotos = new Proxy(data.photos, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

export const mockVotes = new Proxy(data.votes, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

export const mockComments = new Proxy(data.comments, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

export const mockSubscriptions = new Proxy(data.pushSubscriptions, {
  set(target, prop, value) {
    target[prop as any] = value;
    saveData(data);
    return true;
  }
});

// Functions to manipulate arrays that auto-save
export function addReport(report: any) {
  data.reports.push(report);
  saveData(data);
  return report;
}

export function addPhoto(photo: any) {
  data.photos.push(photo);
  saveData(data);
  return photo;
}

export function addComment(comment: any) {
  data.comments.push(comment);
  saveData(data);
  return comment;
}

export function getComments(reportId: string) {
  return data.comments.filter((c: any) => c.reportId === reportId);
}

export function getCommentCount(reportId: string) {
  return data.comments.filter((c: any) => c.reportId === reportId).length;
}

export function deleteComment(commentId: string, userId: string) {
  const index = data.comments.findIndex((c: any) => c.id === commentId && c.userId === userId);
  if (index !== -1) {
    data.comments.splice(index, 1);
    saveData(data);
    return true;
  }
  return false;
}

export function addVote(vote: any) {
  data.votes.push(vote);
  saveData(data);
  return vote;
}

export function removeVote(userId: string, reportId: string) {
  const index = data.votes.findIndex((v: any) => v.userId === userId && v.reportId === reportId);
  if (index !== -1) {
    data.votes.splice(index, 1);
    saveData(data);
    return true;
  }
  return false;
}

export function hasUserVoted(userId: string, reportId: string) {
  return data.votes.some((v: any) => v.userId === userId && v.reportId === reportId);
}

export function getVoteCount(reportId: string) {
  return data.votes.filter((v: any) => v.reportId === reportId).length;
}

export function updateUser(userId: string, updates: any) {
  const userIndex = data.users.findIndex((u: any) => u.id === userId);
  if (userIndex !== -1) {
    data.users[userIndex] = { ...data.users[userIndex], ...updates };
    saveData(data);
    return data.users[userIndex];
  }
  return null;
}

export function updateReport(reportId: string, updates: any) {
  const reportIndex = data.reports.findIndex((r: any) => r.id === reportId);
  if (reportIndex !== -1) {
    data.reports[reportIndex] = { 
      ...data.reports[reportIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveData(data);
    return data.reports[reportIndex];
  }
  return null;
}

// Generate unique ID
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Delete report and clean up associated data
export function deleteReport(reportId: string): boolean {
  const reportIndex = data.reports.findIndex((r: any) => r.id === reportId);
  if (reportIndex === -1) return false;
  
  // Remove the report
  data.reports.splice(reportIndex, 1);
  
  // Clean up votes for this report
  data.votes = data.votes.filter((v: any) => v.reportId !== reportId);
  
  // Clean up comments for this report
  data.comments = data.comments.filter((c: any) => c.reportId !== reportId);
  
  // Clean up photos for this report
  data.photos = data.photos.filter((p: any) => p.reportId !== reportId);
  
  saveData(data);
  return true;
}

// Get current data
export function getData() {
  return data;
}

// Push Subscription functions
export function addPushSubscription(subscription: any) {
  // Check if subscription already exists
  const existingIndex = data.pushSubscriptions.findIndex(
    (s: any) => s.endpoint === subscription.endpoint
  );
  if (existingIndex !== -1) {
    // Update existing
    data.pushSubscriptions[existingIndex] = subscription;
  } else {
    // Add new
    data.pushSubscriptions.push(subscription);
  }
  saveData(data);
  return subscription;
}

export function removePushSubscription(endpoint: string) {
  data.pushSubscriptions = data.pushSubscriptions.filter(
    (s: any) => s.endpoint !== endpoint
  );
  saveData(data);
  return true;
}

export function getUserSubscriptions(userId: string) {
  return data.pushSubscriptions.filter((s: any) => s.userId === userId);
}
