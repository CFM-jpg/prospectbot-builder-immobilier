// lib/supabase.js
// Configuration et helper pour Supabase

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client Supabase pour le frontend (avec clé anon)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client Supabase pour le backend (avec service role key pour bypasser RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper pour gérer les erreurs Supabase
export function handleSupabaseError(error) {
  console.error('Erreur Supabase:', error);
  return {
    error: true,
    message: error.message || 'Une erreur est survenue',
    details: error
  };
}

// Helper pour formater les réponses
export function formatResponse(data, error = null) {
  if (error) {
    return {
      success: false,
      error: error.message || 'Une erreur est survenue',
      data: null
    };
  }
  
  return {
    success: true,
    data: data,
    error: null
  };
}
