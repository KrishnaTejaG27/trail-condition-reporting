import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// User registration validation schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

// User login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Report creation validation schema
export const createReportSchema = z.object({
  conditionType: z.enum([
    'FALLEN_TREE', 'MUD', 'FLOODING', 'ICE', 'SNOW', 'ROCK_SLIDE',
    'WILDLIFE', 'BRIDGE_DAMAGE', 'TRAIL_CLOSURE', 'EROSION', 'DEBRIS',
    'CONSTRUCTION', 'MAINTENANCE', 'OTHER'
  ]),
  severityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  affectedArea: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }).optional(),
  trailId: z.string().uuid().optional(),
});

// User profile update validation schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  preferences: z.object({}).optional(),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages,
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
    }
  };
};

// Export validation middleware
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateCreateReport = validate(createReportSchema);
export const validateUpdateProfile = validate(updateProfileSchema);
