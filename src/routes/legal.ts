import { Router, Request, Response } from 'express';
import { verifyToken, checkPermission, auditLog } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(auditLog);

// Get all legal documents (viewer access)
router.get('/documents', checkPermission('read'), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch legal documents' });
  }
});

// Create new legal document (admin/legal_manager access)
router.post('/documents', checkPermission('write'), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create legal document' });
  }
});

// Update legal document (admin/legal_manager access)
router.put('/documents/:id', checkPermission('write'), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update legal document' });
  }
});

// Delete legal document (admin access only)
router.delete('/documents/:id', checkPermission('delete'), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete legal document' });
  }
});

export default router; 