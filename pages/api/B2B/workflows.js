// pages/api/B2B/workflows.js
import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const { action } = req.body;

  try {
    switch (action) {
      case 'list':
        return await listWorkflows(req, res, agentEmail);
      case 'create':
        return await createWorkflow(req, res, agentEmail);
      case 'toggle':
        return await toggleWorkflow(req, res, agentEmail);
      case 'delete':
        return await deleteWorkflow(req, res, agentEmail);
      default:
        return res.status(400).json({ error: 'Action invalide' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function listWorkflows(req, res, agentEmail) {
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('agent_email', agentEmail)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return res.status(200).json({ success: true, workflows: data || [] });
}

async function createWorkflow(req, res, agentEmail) {
  const { name, trigger, actions } = req.body;
  if (!name || !trigger) return res.status(400).json({ error: 'Nom et déclencheur requis' });

  const { data, error } = await supabaseAdmin
    .from('workflows')
    .insert([{ agent_email: agentEmail, name, trigger, actions: actions || [], active: true }])
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, workflow: data });
}

async function toggleWorkflow(req, res, agentEmail) {
  const { workflow_id, active } = req.body;
  if (!workflow_id) return res.status(400).json({ error: 'workflow_id requis' });

  const { error } = await supabaseAdmin
    .from('workflows')
    .update({ active })
    .eq('id', workflow_id)
    .eq('agent_email', agentEmail);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

async function deleteWorkflow(req, res, agentEmail) {
  const { workflow_id } = req.body;
  if (!workflow_id) return res.status(400).json({ error: 'workflow_id requis' });

  const { error } = await supabaseAdmin
    .from('workflows')
    .delete()
    .eq('id', workflow_id)
    .eq('agent_email', agentEmail);

  if (error) throw error;
  return res.status(200).json({ success: true });
}
