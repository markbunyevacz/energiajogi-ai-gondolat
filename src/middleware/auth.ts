import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

// Define role types
export type UserRole = 'admin' | 'legal_manager' | 'analyst' | 'viewer';

// Define role permissions
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  legal_manager: ['read', 'write', 'delete'],
  analyst: ['read', 'write'],
  viewer: ['read']
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Middleware to verify JWT token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      return res.status(403).json({ error: 'User role not found' });
    }

    // Attach user and role to request
    req.user = user;
    req.userRole = roleData.role;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check role permissions
export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole as UserRole;
    
    if (!userRole) {
      return res.status(403).json({ error: 'User role not found' });
    }

    const permissions = rolePermissions[userRole];
    
    if (!permissions.includes('*') && !permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to log audit trail
export const auditLog = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function (body: any) {
    // Log the action after the response is sent
    const logData = {
      user_id: req.user?.id,
      action: req.method,
      table_name: req.path.split('/')[1],
      record_id: req.params.id,
      old_data: req.body.oldData,
      new_data: req.body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };

    supabase
      .from('audit_log')
      .insert(logData)
      .then(() => {})
      .catch((error: Error) => console.error('Audit log error:', error));

    return originalSend.call(this, body);
  };

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userRole?: UserRole;
    }
  }
} 