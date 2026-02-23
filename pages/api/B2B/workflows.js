// pages/api/B2B/workflows.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    switch (action) {
      case 'list':
        return await listWorkflows(req, res);
      case 'create':
        return await createWorkflow(req, res);
      case 'toggle':
        return await toggleWorkflow(req, res);
      case 'delete':
        return await deleteWorkflow(req, res);
      default:
        return res.status(400).json({ error: 'Action invalide' });
    }
  } catch (error) {
    console.error('Erreur workflows API:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function listWorkflows(req, res) {
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return res.status(200).json({ success: true, workflows: data || [] });
}

async function createWorkflow(req, res) {
  const { name, trigger, actions } = req.body;

  if (!name || !trigger) {
    return res.status(400).json({ error: 'Nom et déclencheur requis' });
  }

  const { data, error } = await supabaseAdmin
    .from('workflows')
    .insert([{ name, trigger, actions: actions || [], active: true }])
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, workflow: data });
}

async function toggleWorkflow(req, res) {
  const { workflow_id, active } = req.body;

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id requis' });
  }

  const { error } = await supabaseAdmin
    .from('workflows')
    .update({ active })
    .eq('id', workflow_id);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

async function deleteWorkflow(req, res) {
  const { workflow_id } = req.body;

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id requis' });
  }

  const { error } = await supabaseAdmin
    .from('workflows')
    .delete()
    .eq('id', workflow_id);

  if (error) throw error;
  return res.status(200).json({ success: true });
}
