// pages/api/B2B/chatbot-conversations.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // GET — lister les conversations
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('chatbot_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        conversations: data || []
      });
    } catch (error) {
      console.error('Erreur GET conversations:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, chatbot_id, visitor_email, visitor_name } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  try {
    // ========== LOGIQUE DE QUALIFICATION INTELLIGENTE ==========
    const messageLower = message.toLowerCase();
    let qualified = false;
    let qualificationReason = '';
    let reply = '';

    // 1. Mots-clés d'INTÉRÊT COMMERCIAL FORT (qualifié = true)
    const strongInterest = [
      'prix', 'tarif', 'coût', 'combien', 'budget', 'payer',
      'demo', 'démo', 'démonstration', 'essai', 'test', 'essayer',
      'acheter', 'achat', 'commander', 'souscrire', 'abonnement',
      'rdv', 'rendez-vous', 'appeler', 'appel', 'téléphone', 'contact urgent'
    ];

    // 2. Mots-clés d'INTÉRÊT MOYEN (qualifié = true mais moins urgent)
    const mediumInterest = [
      'information', 'renseignement', 'en savoir plus', 'détails',
      'fonctionnalité', 'caractéristique', 'capacité',
      'projet', 'besoin', 'recherche', 'solution'
    ];

    // 3. Mots-clés de SIMPLE CURIOSITÉ (qualifié = false)
    const lowInterest = [
      'bonjour', 'salut', 'hello', 'hi',
      'disponible', 'horaire', 'ouvert',
      'merci', 'ok', 'd\'accord'
    ];

    // ========== ANALYSE DU MESSAGE ==========
    
    // Vérifier intérêt commercial fort
    if (strongInterest.some(keyword => messageLower.includes(keyword))) {
      qualified = true;
      
      if (messageLower.includes('prix') || messageLower.includes('tarif') || messageLower.includes('coût') || messageLower.includes('combien')) {
        qualificationReason = 'Demande de tarification';
        reply = "Je comprends que vous souhaitez connaître nos tarifs. Nos solutions sont personnalisées selon vos besoins. Un conseiller commercial va vous contacter sous 2h pour vous présenter une offre adaptée. Puis-je avoir votre email et votre numéro de téléphone pour qu'il vous recontacte ?";
      } 
      else if (messageLower.includes('demo') || messageLower.includes('démo') || messageLower.includes('essai') || messageLower.includes('test')) {
        qualificationReason = 'Demande de démonstration';
        reply = "Excellent choix ! Une démonstration personnalisée est la meilleure façon de découvrir nos solutions. Je vais organiser cela pour vous. Un membre de notre équipe vous contactera dans les 24h pour planifier une démo adaptée à vos besoins. Pouvez-vous me donner votre email et votre secteur d'activité ?";
      }
      else if (messageLower.includes('acheter') || messageLower.includes('achat') || messageLower.includes('commander') || messageLower.includes('souscrire')) {
        qualificationReason = 'Intention d\'achat immédiate';
        reply = "Parfait ! Nous sommes ravis de votre intérêt. Pour finaliser votre commande dans les meilleures conditions, un conseiller dédié va vous accompagner. Il vous contactera sous 1h. Merci de me communiquer votre email et numéro de téléphone.";
      }
      else if (messageLower.includes('rdv') || messageLower.includes('rendez-vous') || messageLower.includes('appeler') || messageLower.includes('appel')) {
        qualificationReason = 'Demande de contact direct';
        reply = "Avec plaisir ! Je vais transférer votre demande à un conseiller qui vous contactera rapidement pour planifier un échange. À quelle heure préférez-vous être contacté ? Et quel est votre numéro de téléphone ?";
      }
    }
    
    // Vérifier intérêt moyen
    else if (mediumInterest.some(keyword => messageLower.includes(keyword))) {
      qualified = true;
      qualificationReason = 'Recherche d\'information';
      reply = "Je serais ravi de vous aider ! Pour vous fournir les informations les plus pertinentes, pouvez-vous me préciser :\n- Votre secteur d'activité ?\n- Le type de solution que vous recherchez ?\n- Vos objectifs principaux ?\n\nUn conseiller pourra ensuite vous guider de manière personnalisée.";
    }
    
    // Simple curiosité ou message générique
    else if (lowInterest.some(keyword => messageLower.includes(keyword))) {
      qualified = false;
      qualificationReason = 'Message générique';
      reply = "Bonjour ! Je suis là pour vous aider. Comment puis-je vous renseigner sur nos solutions ? N'hésitez pas à me poser vos questions !";
    }
    
    // Message non catégorisé
    else {
      qualified = false;
      qualificationReason = 'Non catégorisé';
      reply = "Merci pour votre message ! Pour mieux vous aider, pourriez-vous préciser votre demande ? Un conseiller examinera votre message et vous répondra rapidement.";
    }

    // ========== DÉTECTION EMAIL DANS LE MESSAGE ==========
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const detectedEmail = message.match(emailRegex);
    const finalEmail = visitor_email || (detectedEmail ? detectedEmail[0] : null);

    // ========== DÉTECTION TÉLÉPHONE DANS LE MESSAGE ==========
    const phoneRegex = /(\+33|0033|0)[1-9][\s.-]?(\d{2}[\s.-]?){4}/;
    const detectedPhone = message.match(phoneRegex);
    const finalPhone = detectedPhone ? detectedPhone[0] : null;

    // ========== STOCKAGE EN BASE DE DONNÉES ==========
    const conversationData = {
      chatbot_id: chatbot_id || null,
      visitor_email: finalEmail,
      visitor_name: visitor_name || null,
      visitor_phone: finalPhone,
      messages: [
        { 
          role: 'user', 
          content: message,
          timestamp: new Date().toISOString()
        },
        { 
          role: 'assistant', 
          content: reply,
          timestamp: new Date().toISOString()
        }
      ],
      qualified: qualified,
      qualification_reason: qualificationReason,
      qualification_score: qualified ? (strongInterest.some(k => messageLower.includes(k)) ? 100 : 50) : 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('chatbot_conversations')
      .insert([conversationData])
      .select();

    if (error) throw error;

    // ========== SI QUALIFIÉ, CRÉER UN PROSPECT ==========
    if (qualified && finalEmail) {
      try {
        // Extraire nom depuis email si pas fourni
        let firstName = visitor_name || '';
        let lastName = '';
        
        if (!firstName && finalEmail) {
          const emailParts = finalEmail.split('@')[0].split('.');
          firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : '';
          lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '';
        }

        await supabaseAdmin
          .from('prospects')
          .insert([{
            first_name: firstName,
            last_name: lastName,
            email: finalEmail,
            phone: finalPhone || '',
            source: 'chatbot',
            notes: `Qualification: ${qualificationReason}\nMessage initial: ${message}`,
            created_at: new Date().toISOString()
          }]);
      } catch (prospectError) {
        console.warn('⚠️ Erreur création prospect:', prospectError);
        // On ne bloque pas la réponse si la création du prospect échoue
      }
    }

    // ========== RÉPONSE FINALE ==========
    res.status(200).json({ 
      success: true, 
      reply,
      qualified,
      qualification_reason: qualificationReason,
      detected_email: finalEmail,
      detected_phone: finalPhone,
      conversation: data[0]
    });

  } catch (error) {
    console.error('❌ Erreur chatbot conversation:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
}
