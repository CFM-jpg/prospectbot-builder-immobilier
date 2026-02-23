 ProspectBot Builder

Plateforme complète de création de bots pour la prospection commerciale.

  Fonctionnalités

-  Chatbot Builder** - Créez des conversations intelligentes pour qualifier vos leads
-  Email Automation** - Automatisez vos séquences d'emails de prospection
-  Web Scraper** - Collectez automatiquement des informations sur vos prospects
-  Workflow Builder** - Créez des scénarios de prospection end-to-end

 Déploiement sur Vercel

Méthode 1 : Déploiement via GitHub (Recommandé)

1. Créer un repository GitHub**
   - Allez sur https://github.com/new
   - Créez un nouveau repository public ou privé
   - Ne cochez PAS "Initialize with README"

2. Pousser le code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ProspectBot Builder"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/prospectbot-builder.git
   git push -u origin main
   ```

3. Déployer sur Vercel**
   - Allez sur https://vercel.com
   - Cliquez sur "Sign Up" et connectez-vous avec GitHub
   - Cliquez sur "Add New" → "Project"
   - Sélectionnez votre repository "prospectbot-builder"
   - Vercel détecte automatiquement Vite
   - Cliquez sur "Deploy"
   - Votre site sera en ligne en 1-2 minutes !

 Méthode 2 : Déploiement via Vercel CLI

1. Installer Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Se connecter à Vercel
   ```bash
   vercel login
   ```

3. Déployer
   ```bash
   vercel
   ```
   - Suivez les instructions interactives
   - Acceptez les paramètres par défaut
   - Votre site sera déployé !

 Méthode 3 : Drag & Drop sur Vercel

1. Builder le projet
   ```bash
   npm install
   npm run build
   ```

2. Déployer le dossier dist
   - Allez sur https://vercel.com/new
   - Glissez-déposez le dossier `dist` généré
   - Vercel déploiera automatiquement !

 Développement Local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Builder pour la production
npm run build
```

 Configuration

L'application est prête à l'emploi ! Pour ajouter des fonctionnalités :

- Base de données : Ajoutez Supabase ou Firebase
- Authentification : Intégrez Auth0 ou Clerk
- Paiements : Connectez Stripe pour le mode SaaS

 Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Vercel (hébergement)

 Support

Pour toute question, ouvrez une issue sur GitHub.

