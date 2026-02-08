import React, { useState, useEffect } from 'react'; 
import { Bot, Plus, Trash2, Save, Eye, Download, MessageSquare, Settings, Play, ArrowRight } from 'lucide-react';

export default function ChatbotBuilder() {
  const [chatbots, setChatbots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Formulaire de création
  const [botName, setBotName] = useState('');
  const [botColor, setBotColor] = useState('#8b5cf6');
  const [botAvatar, setBotAvatar] = useState('🤖');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, question: '', answer: '' }
  ]);

  // État du chat de prévisualisation
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    loadChatbots();
  }, []);

  const loadChatbots = async () => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setChatbots(data.chatbots || []);
      }
    } catch (error) {
      console.error('Erreur chargement chatbots:', error);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      question: '', 
      answer: '' 
    }]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const saveChatbot = async () => {
    if (!botName.trim()) {
      alert('Veuillez entrer un nom pour le chatbot');
      return;
    }

    const chatbotData = {
      name: botName,
      color: botColor,
      avatar: botAvatar,
      welcomeMessage: welcomeMessage,
      questions: questions.filter(q => q.question.trim() && q.answer.trim())
    };

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatbotData)
      });

      if (response.ok) {
        alert('✅ Chatbot sauvegardé !');
        loadChatbots();
        resetForm();
      } else {
        alert('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setBotName('');
    setBotColor('#8b5cf6');
    setBotAvatar('🤖');
    setWelcomeMessage('');
    setQuestions([{ id: 1, question: '', answer: '' }]);
    setIsCreating(false);
    setChatMessages([]);
  };

  const testChatbot = () => {
    if (!welcomeMessage.trim()) {
      alert('Ajoutez un message de bienvenue pour tester');
      return;
    }
    
    setChatMessages([{
      type: 'bot',
      text: welcomeMessage,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;

    // Ajouter le message utilisateur
    const newMessages = [...chatMessages, {
      type: 'user',
      text: userInput,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }];

    // Chercher une réponse correspondante
    const matchedQuestion = questions.find(q => 
      q.question.toLowerCase().includes(userInput.toLowerCase()) ||
      userInput.toLowerCase().includes(q.question.toLowerCase())
    );

    if (matchedQuestion && matchedQuestion.answer.trim()) {
      newMessages.push({
        type: 'bot',
        text: matchedQuestion.answer,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      newMessages.push({
        type: 'bot',
        text: "Je n'ai pas compris votre question. Pouvez-vous la reformuler ?",
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
    }

    setChatMessages(newMessages);
    setUserInput('');
  };

  const exportCode = () => {
    const chatbotData = {
      name: botName || 'Mon Chatbot',
      color: botColor,
      avatar: botAvatar,
      welcomeMessage: welcomeMessage,
      questions: questions.filter(q => q.question.trim() && q.answer.trim())
    };

    const code = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatbot Widget - ${botName || 'Mon Chatbot'}</title>
  <style>
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .chatbot-button {
      background: ${botColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      cursor: pointer;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    }
    .chatbot-button:hover {
      transform: scale(1.1);
    }
    .chatbot-window {
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: none;
      position: absolute;
      bottom: 80px;
      right: 0;
      flex-direction: column;
    }
    .chatbot-window.active {
      display: flex;
    }
    .chat-header {
      padding: 20px;
      background: ${botColor};
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f9fafb;
    }
    .message {
      margin-bottom: 12px;
      display: flex;
    }
    .message.bot {
      justify-content: flex-start;
    }
    .message.user {
      justify-content: flex-end;
    }
    .message-content {
      max-width: 80%;
      padding: 12px;
      border-radius: 8px;
    }
    .message.bot .message-content {
      background: white;
      border: 1px solid #e5e7eb;
      color: #1f2937;
    }
    .message.user .message-content {
      background: ${botColor};
      color: white;
    }
    .chat-input {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    .chat-input input {
      flex: 1;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      outline: none;
    }
    .chat-input button {
      background: ${botColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="chatbot-container">
    <button class="chatbot-button" onclick="toggleChat()">${botAvatar}</button>
    <div class="chatbot-window" id="chatWindow">
      <div class="chat-header">
        <span style="font-size: 28px;">${botAvatar}</span>
        <div>
          <div style="font-weight: 600;">${botName || 'Mon Chatbot'}</div>
          <div style="font-size: 12px; opacity: 0.9;">En ligne</div>
        </div>
      </div>
      <div class="chat-messages" id="messages"></div>
      <div class="chat-input">
        <input type="text" id="userInput" placeholder="Tapez votre message..." onkeypress="handleKeyPress(event)">
        <button onclick="sendMessage()">Envoyer</button>
      </div>
    </div>
  </div>

  <script>
    const chatbotConfig = ${JSON.stringify(chatbotData, null, 2)};
    const messages = [];

    function toggleChat() {
      const window = document.getElementById('chatWindow');
      window.classList.toggle('active');
      
      // Envoyer le message de bienvenue au premier clic
      if (window.classList.contains('active') && messages.length === 0) {
        addMessage('bot', chatbotConfig.welcomeMessage);
      }
    }

    function addMessage(type, text) {
      const messagesDiv = document.getElementById('messages');
      const messageEl = document.createElement('div');
      messageEl.className = 'message ' + type;
      messageEl.innerHTML = '<div class="message-content">' + text + '</div>';
      messagesDiv.appendChild(messageEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      messages.push({ type, text });
    }

    function sendMessage() {
      const input = document.getElementById('userInput');
      const userMessage = input.value.trim();
      
      if (!userMessage) return;
      
      addMessage('user', userMessage);
      input.value = '';
      
      // Rechercher une réponse
      setTimeout(() => {
        const response = findResponse(userMessage);
        addMessage('bot', response);
      }, 500);
    }

    function findResponse(userMessage) {
      const lowerMessage = userMessage.toLowerCase();
      
      for (const qa of chatbotConfig.questions) {
        if (lowerMessage.includes(qa.question.toLowerCase()) || 
            qa.question.toLowerCase().includes(lowerMessage)) {
          return qa.answer;
        }
      }
      
      return "Je n'ai pas compris votre question. Pouvez-vous la reformuler ?";
    }

    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    }
  </script>
</body>
</html>`;

    // Télécharger le code
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-${(botName || 'mon-chatbot').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex gap-6">
      {/* PANNEAU GAUCHE - Création */}
      <div className="w-1/2 bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-lg">
              <Bot className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Chatbot Builder</h2>
              <p className="text-sm text-gray-500">Créez votre assistant virtuel</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Bot
          </button>
        </div>

        {/* Liste des chatbots existants */}
        {!isCreating && chatbots.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Mes Chatbots</h3>
            {chatbots.map(bot => (
              <div key={bot.id} className="p-4 border border-gray-200 rounded-lg hover:border-violet-400 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bot.avatar}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">{bot.name}</h4>
                      <p className="text-xs text-gray-500">{bot.questions?.length || 0} questions configurées</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-violet-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire de création */}
        {(isCreating || chatbots.length === 0) && (
          <div className="space-y-6">
            {/* Configuration générale */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du chatbot
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Ex: Assistant Support Client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar (emoji)
                  </label>
                  <input
                    type="text"
                    value={botAvatar}
                    onChange={(e) => setBotAvatar(e.target.value)}
                    placeholder="🤖"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={botColor}
                      onChange={(e) => setBotColor(e.target.value)}
                      className="w-16 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={botColor}
                      onChange={(e) => setBotColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de bienvenue
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Questions et Réponses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Questions & Réponses
                </h3>
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                      {questions.length > 1 && (
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                      placeholder="Ex: Quels sont vos horaires ?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                    />
                    
                    <textarea
                      value={q.answer}
                      onChange={(e) => updateQuestion(q.id, 'answer', e.target.value)}
                      placeholder="Ex: Nous sommes ouverts du lundi au vendredi de 9h à 18h."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={saveChatbot}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
              <button
                onClick={testChatbot}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                Tester
              </button>
              <button
                onClick={exportCode}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PANNEAU DROIT - Prévisualisation */}
      <div className="w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Prévisualisation</h3>
          </div>
          <button
            onClick={() => setChatMessages([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Réinitialiser
          </button>
        </div>

        {/* Widget Chatbot */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* En-tête */}
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: botColor }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{botAvatar}</span>
                <div>
                  <h4 className="font-semibold">{botName || 'Mon Chatbot'}</h4>
                  <p className="text-xs opacity-90">En ligne</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-16 h-16 text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">
                    Cliquez sur "Tester" pour démarrer la conversation
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'user' 
                        ? 'bg-violet-600 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'text-violet-200' : 'text-gray-400'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  style={{ backgroundColor: botColor }}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
