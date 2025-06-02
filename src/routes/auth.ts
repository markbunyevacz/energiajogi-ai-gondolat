import { Router, Request, Response } from 'express';
import { verifyToken, checkPermission, auditLog } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Apply authentication middleware to protected routes
router.use('/protected/*', verifyToken);
router.use('/protected/*', auditLog);

// Public routes
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Assign role to user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user?.id,
        role: role || 'viewer' // Default to viewer if no role specified
      });

    if (roleError) throw roleError;

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({
      token: data.session?.access_token,
      user: data.user
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected routes
router.post('/protected/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/protected/session', async (req: Request, res: Response) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

router.post('/protected/refresh', async (req: Request, res: Response) => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

// Admin only routes
router.post('/protected/users/:userId/role', checkPermission('admin'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role
      });

    if (error) throw error;
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.get('/protected/users', checkPermission('admin'), async (req: Request, res: Response) => {
  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    if (rolesError) throw rolesError;

    // Combine user data with roles
    const usersWithRoles = users.users.map(user => ({
      ...user,
      role: roles.find(r => r.user_id === user.id)?.role
    }));

    res.json(usersWithRoles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router; 