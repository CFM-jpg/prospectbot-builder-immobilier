// pages/api/B2B/email-automation.js
import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const { action } = req.body;

  try {
    switch (action) {
      case 'list_campaigns':
        return await listCampaigns(req, res, agentEmail);
      case 'create_campaign':
        return await createCampaign(req, res, agentEmail);
      case 'update_campaign_status':
        return await updateCampaignStatus(req, res, agentEmail);
      case 'delete_campaign':
        return await deleteCampaign(req, res, agentEmail);
      case 'list_templates':
        return await listTemplates(req, res, agentEmail);
      case 'create_template':
        return await createTemplate(req, res, agentEmail);
      case 'delete_template':
        return await deleteTemplate(req, res, agentEmail);
      case 'list_sequences':
        return await listSequences(req, res, agentEmail);
      case 'add_sequence':
        return await addSequence(req, res, agentEmail);
      case 'delete_sequence':
        return await deleteSequence(req, res, agentEmail);
      case 'get_stats':
        return await getStats(req, res, agentEmail);
      default:
        return res.status(400).json({ error: 'Action invalide' });
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ========== FONCTIONS CAMPAGNES ==========
async function listCampaigns(req, res, agentEmail) {
  const { data, error } = await supabaseAdmin
    .from('email_campaigns')
    .select('*')
    .eq('agent_email', agentEmail)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return res.status(200).json({ success: true, campaigns: data || [] });
}

async function createCampaign(req, res, agentEmail) {
  const { title, description, campaign_type, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const { data, error } = await supabaseAdmin
    .from('email_campaigns')
    .insert([{
      title,
      description: description || '',
      campaign_type: campaign_type || 'manual',
      status: status || 'draft',
      agent_email: agentEmail
    }])
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, campaign: data });
}

async function updateCampaignStatus(req, res, agentEmail) {
  const { campaign_id, status } = req.body;
  if (!campaign_id || !status) return res.status(400).json({ error: 'campaign_id et status requis' });

  const { error } = await supabaseAdmin
    .from('email_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaign_id)
    .eq('agent_email', agentEmail);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

async function deleteCampaign(req, res, agentEmail) {
  const { campaign_id } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id requis' });

  const { error } = await supabaseAdmin
    .from('email_campaigns')
    .delete()
    .eq('id', campaign_id)
    .eq('agent_email', agentEmail);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ========== FONCTIONS TEMPLATES ==========
async function listTemplates(req, res, agentEmail) {
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('agent_email', agentEmail)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return res.status(200).json({ success: true, templates: data || [] });
}

async function createTemplate(req, res, agentEmail) {
  const { name, subject, body } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ error: 'Tous les champs sont requis' });

  const variables = extractVariables(body + ' ' + subject);

  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .insert([{ name, subject, body, variables, agent_email: agentEmail }])
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, template: data });
}

async function deleteTemplate(req, res, agentEmail) {
  const { template_id } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requis' });

  const { error } = await supabaseAdmin
    .from('email_templates')
    .delete()
    .eq('id', template_id)
    .eq('agent_email', agentEmail);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ========== FONCTIONS SÉQUENCES ==========
async function listSequences(req, res, agentEmail) {
  const { campaign_id } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id requis' });

  const { data, error } = await supabaseAdmin
    .from('email_sequences')
    .select('*, template:email_templates(*)')
    .eq('campaign_id', campaign_id)
    .order('sequence_order', { ascending: true });

  if (error) throw error;
  return res.status(200).json({ success: true, sequences: data || [] });
}

async function addSequence(req, res, agentEmail) {
  const { campaign_id, template_id, delay_minutes } = req.body;
  if (!campaign_id || !template_id) return res.status(400).json({ error: 'campaign_id et template_id requis' });

  const { data: existingSequences } = await supabaseAdmin
    .from('email_sequences')
    .select('sequence_order')
    .eq('campaign_id', campaign_id)
    .order('sequence_order', { ascending: false })
    .limit(1);

  const nextOrder = existingSequences?.length > 0 ? existingSequences[0].sequence_order + 1 : 1;

  const { data, error } = await supabaseAdmin
    .from('email_sequences')
    .insert([{ campaign_id, template_id, sequence_order: nextOrder, delay_minutes: delay_minutes || 0 }])
    .select('*, template:email_templates(*)')
    .single();

  if (error) throw error;
  return res.status(200).json({ success: true, sequence: data });
}

async function deleteSequence(req, res, agentEmail) {
  const { sequence_id } = req.body;
  if (!sequence_id) return res.status(400).json({ error: 'sequence_id requis' });

  const { error } = await supabaseAdmin
    .from('email_sequences')
    .delete()
    .eq('id', sequence_id);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ========== FONCTIONS STATS ==========
async function getStats(req, res, agentEmail) {
  const { data: logs, error } = await supabaseAdmin
    .from('email_logs')
    .select('status, opened_at, clicked_at, bounced_at')
    .eq('agent_email', agentEmail);

  if (error) throw error;

  const stats = {
    total_sent: logs.length,
    total_opened: logs.filter(l => l.opened_at).length,
    total_clicked: logs.filter(l => l.clicked_at).length,
    total_bounced: logs.filter(l => l.bounced_at).length
  };

  return res.status(200).json({ success: true, stats });
}

// ========== HELPER FUNCTIONS ==========
function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}
