// pages/api/email-automation.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Utilisez la clé SERVICE ROLE, pas ANON
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    switch (action) {
      // ========== CAMPAGNES ==========
      case 'list_campaigns':
        return await listCampaigns(req, res);
      
      case 'create_campaign':
        return await createCampaign(req, res);
      
      case 'update_campaign_status':
        return await updateCampaignStatus(req, res);
      
      case 'delete_campaign':
        return await deleteCampaign(req, res);

      // ========== TEMPLATES ==========
      case 'list_templates':
        return await listTemplates(req, res);
      
      case 'create_template':
        return await createTemplate(req, res);
      
      case 'delete_template':
        return await deleteTemplate(req, res);

      // ========== SÉQUENCES ==========
      case 'list_sequences':
        return await listSequences(req, res);
      
      case 'add_sequence':
        return await addSequence(req, res);
      
      case 'delete_sequence':
        return await deleteSequence(req, res);

      // ========== STATS ==========
      case 'get_stats':
        return await getStats(req, res);

      default:
        return res.status(400).json({ error: 'Action invalide' });
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ========== FONCTIONS CAMPAGNES ==========
async function listCampaigns(req, res) {
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return res.status(200).json({
    success: true,
    campaigns: data || []
  });
}

async function createCampaign(req, res) {
  const { title, description, campaign_type, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Titre requis' });
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert([{
      title,
      description: description || '',
      campaign_type: campaign_type || 'manual',
      status: status || 'draft'
    }])
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    campaign: data
  });
}

async function updateCampaignStatus(req, res) {
  const { campaign_id, status } = req.body;

  if (!campaign_id || !status) {
    return res.status(400).json({ error: 'campaign_id et status requis' });
  }

  const { error } = await supabase
    .from('email_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaign_id);

  if (error) throw error;

  return res.status(200).json({ success: true });
}

async function deleteCampaign(req, res) {
  const { campaign_id } = req.body;

  if (!campaign_id) {
    return res.status(400).json({ error: 'campaign_id requis' });
  }

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', campaign_id);

  if (error) throw error;

  return res.status(200).json({ success: true });
}

// ========== FONCTIONS TEMPLATES ==========
async function listTemplates(req, res) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return res.status(200).json({
    success: true,
    templates: data || []
  });
}

async function createTemplate(req, res) {
  const { name, subject, body } = req.body;

  if (!name || !subject || !body) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  // Extraire les variables du template
  const variables = extractVariables(body + ' ' + subject);

  const { data, error } = await supabase
    .from('email_templates')
    .insert([{
      name,
      subject,
      body,
      variables
    }])
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    template: data
  });
}

async function deleteTemplate(req, res) {
  const { template_id } = req.body;

  if (!template_id) {
    return res.status(400).json({ error: 'template_id requis' });
  }

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', template_id);

  if (error) throw error;

  return res.status(200).json({ success: true });
}

// ========== FONCTIONS SÉQUENCES ==========
async function listSequences(req, res) {
  const { campaign_id } = req.body;

  if (!campaign_id) {
    return res.status(400).json({ error: 'campaign_id requis' });
  }

  const { data, error } = await supabase
    .from('email_sequences')
    .select(`
      *,
      template:email_templates(*)
    `)
    .eq('campaign_id', campaign_id)
    .order('sequence_order', { ascending: true });

  if (error) throw error;

  return res.status(200).json({
    success: true,
    sequences: data || []
  });
}

async function addSequence(req, res) {
  const { campaign_id, template_id, delay_minutes } = req.body;

  if (!campaign_id || !template_id) {
    return res.status(400).json({ error: 'campaign_id et template_id requis' });
  }

  // Trouver le prochain ordre
  const { data: existingSequences } = await supabase
    .from('email_sequences')
    .select('sequence_order')
    .eq('campaign_id', campaign_id)
    .order('sequence_order', { ascending: false })
    .limit(1);

  const nextOrder = existingSequences && existingSequences.length > 0 
    ? existingSequences[0].sequence_order + 1 
    : 1;

  const { data, error } = await supabase
    .from('email_sequences')
    .insert([{
      campaign_id,
      template_id,
      sequence_order: nextOrder,
      delay_minutes: delay_minutes || 0
    }])
    .select(`
      *,
      template:email_templates(*)
    `)
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    sequence: data
  });
}

async function deleteSequence(req, res) {
  const { sequence_id } = req.body;

  if (!sequence_id) {
    return res.status(400).json({ error: 'sequence_id requis' });
  }

  const { error } = await supabase
    .from('email_sequences')
    .delete()
    .eq('id', sequence_id);

  if (error) throw error;

  return res.status(200).json({ success: true });
}

// ========== FONCTIONS STATS ==========
async function getStats(req, res) {
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('status, opened_at, clicked_at, bounced_at');

  if (error) throw error;

  const stats = {
    total_sent: logs.length,
    total_opened: logs.filter(l => l.opened_at).length,
    total_clicked: logs.filter(l => l.clicked_at).length,
    total_bounced: logs.filter(l => l.bounced_at).length
  };

  return res.status(200).json({
    success: true,
    stats
  });
}

// ========== HELPER FUNCTIONS ==========
function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}
