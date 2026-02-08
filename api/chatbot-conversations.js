import { supabase } from './supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message } = req.body

  try {
    const reply = 'Merci pour votre message ! Un conseiller vous contactera.'

    const { data } = await supabase
      .from('chatbot_conversations')
      .insert({ 
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: reply }
        ],
        qualified: false 
      })
      .select()

    res.status(200).json({ success: true, reply })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

### **📄 Fichier 5 : .env.local** (à la racine, pas dans api/)
```
SUPABASE_URL=https://onfzigchicxuhxngdqql.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZnppZ2NoaWN4dWh4bmdkcXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE1MjcsImV4cCI6MjA4NTYzNzUyN30.K6cOndXcAGxbbcUiCb66oyMPc0tcVvU5avjxKJbRy2I
BREVO_API_KEY=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
```

---

## 📁 **Structure finale :**
```
prospectbot/
├── api/
│   ├── supabase.js
│   ├── scraper.js
│   ├── email.js
│   └── chatbot.js
├── src/
├── package.json
├── .env.local
└── ...