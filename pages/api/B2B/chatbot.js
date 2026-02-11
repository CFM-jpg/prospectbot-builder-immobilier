// api/chatbot.js - API Vercel Serverless pour gérer les chatbots
import { supabase } from './supabase'

export default async function handler(req, res) {
  // Gérer les requêtes GET - Récupérer tous les chatbots
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ 
        success: true, 
        chatbots: data || []
      })
    } catch (error) {
      console.error('Erreur GET chatbots:', error)
      return res.status(500).json({ 
        error: error.message 
      })
    }
  }

  // Gérer les requêtes POST - Créer un nouveau chatbot
  if (req.method === 'POST') {
    try {
      const { name, color, avatar, welcomeMessage, questions } = req.body

      // Validation
      if (!name || !welcomeMessage || !questions || questions.length === 0) {
        return res.status(400).json({ 
          error: 'Données invalides. Nom, message de bienvenue et au moins une question requis.' 
        })
      }

      const chatbotData = {
        name,
        color: color || '#8b5cf6',
        avatar: avatar || '🤖',
        welcome_message: welcomeMessage,
        questions: JSON.stringify(questions), // Stocké en JSON
        status: 'active',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('chatbots')
        .insert([chatbotData])
        .select()

      if (error) throw error

      return res.status(200).json({ 
        success: true, 
        chatbot: data[0]
      })
    } catch (error) {
      console.error('Erreur POST chatbot:', error)
      return res.status(500).json({ 
        error: error.message 
      })
    }
  }

  // Gérer les requêtes PUT - Mettre à jour un chatbot
  if (req.method === 'PUT') {
    try {
      const { id, name, color, avatar, welcomeMessage, questions } = req.body

      if (!id) {
        return res.status(400).json({ 
          error: 'ID du chatbot requis' 
        })
      }

      const updateData = {
        name,
        color,
        avatar,
        welcome_message: welcomeMessage,
        questions: JSON.stringify(questions),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('chatbots')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) throw error

      return res.status(200).json({ 
        success: true, 
        chatbot: data[0]
      })
    } catch (error) {
      console.error('Erreur PUT chatbot:', error)
      return res.status(500).json({ 
        error: error.message 
      })
    }
  }

  // Gérer les requêtes DELETE - Supprimer un chatbot
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ 
          error: 'ID du chatbot requis' 
        })
      }

      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({ 
        success: true,
        message: 'Chatbot supprimé'
      })
    } catch (error) {
      console.error('Erreur DELETE chatbot:', error)
      return res.status(500).json({ 
        error: error.message 
      })
    }
  }

  // Méthode non autorisée
  return res.status(405).json({ 
    error: 'Method not allowed' 
  })
}
