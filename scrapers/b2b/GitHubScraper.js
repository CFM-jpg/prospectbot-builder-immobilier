// b2b/GitHubScraper.js

const BaseScraper = require('../core/BaseScraper');
const { Octokit } = require('@octokit/rest');
const config = require('../config/scraper-config');

/**
 * Scraper GitHub pour recrutement tech
 * Utilise l'API officielle GitHub (100% légal)
 */
class GitHubScraper extends BaseScraper {
  constructor(options = {}) {
    super('GitHub', options);
    this.octokit = null;
  }

  /**
   * Initialise le client API GitHub
   */
  async initialize() {
    await super.initialize();
    
    if (!config.b2b.github.token) {
      throw new Error('GITHUB_TOKEN manquant dans .env');
    }

    this.octokit = new Octokit({
      auth: config.b2b.github.token,
      userAgent: 'ProspectBot/1.0'
    });

    // Vérifie le rate limit
    const { data } = await this.octokit.rateLimit.get();
    console.log(`⏱️ Rate limit GitHub: ${data.rate.remaining}/${data.rate.limit}`);
  }

  /**
   * Recherche des développeurs par compétences et localisation
   */
  async searchUsers(params) {
    const {
      skills = [],           // Ex: ['React', 'Node.js']
      location = '',         // Ex: 'Paris'
      minRepos = 5,          // Minimum de repos publics
      minFollowers = 0,      // Minimum de followers
      language = null,       // Ex: 'JavaScript'
      maxResults = 100
    } = params;

    try {
      // Construction de la requête GitHub search
      let query = 'type:user';
      
      if (location) query += ` location:"${location}"`;
      if (language) query += ` language:${language}`;
      if (minRepos > 0) query += ` repos:>=${minRepos}`;
      if (minFollowers > 0) query += ` followers:>=${minFollowers}`;

      console.log(`🔍 Requête GitHub: ${query}`);

      const { data } = await this.octokit.search.users({
        q: query,
        per_page: Math.min(maxResults, 100),
        sort: 'repositories',  // Trie par nombre de repos
        order: 'desc'
      });

      console.log(`✅ ${data.items.length} utilisateurs trouvés`);
      return data.items;
    } catch (error) {
      this.handleError(error, 'searchUsers');
      return [];
    }
  }

  /**
   * Récupère les détails d'un utilisateur
   */
  async getUserDetails(username) {
    try {
      const { data } = await this.octokit.users.getByUsername({
        username
      });

      return data;
    } catch (error) {
      this.handleError(error, `getUserDetails: ${username}`);
      return null;
    }
  }

  /**
   * Récupère les repos d'un utilisateur
   */
  async getUserRepos(username) {
    try {
      const { data } = await this.octokit.repos.listForUser({
        username,
        type: 'owner',
        sort: 'updated',
        per_page: 10  // Les 10 repos les plus récents
      });

      return data;
    } catch (error) {
      this.handleError(error, `getUserRepos: ${username}`);
      return [];
    }
  }

  /**
   * Analyse les compétences depuis les repos
   */
  analyzeSkills(repos) {
    const languageCount = {};
    const frameworks = [];
    const tools = [];

    repos.forEach(repo => {
      // Langages
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }

      // Détection frameworks/outils via nom ou description
      const text = `${repo.name} ${repo.description || ''}`.toLowerCase();
      
      // Frontend
      if (text.includes('react')) frameworks.push('React');
      if (text.includes('vue')) frameworks.push('Vue.js');
      if (text.includes('angular')) frameworks.push('Angular');
      if (text.includes('next')) frameworks.push('Next.js');
      
      // Backend
      if (text.includes('node') || text.includes('express')) frameworks.push('Node.js');
      if (text.includes('django')) frameworks.push('Django');
      if (text.includes('flask')) frameworks.push('Flask');
      if (text.includes('rails')) frameworks.push('Rails');
      if (text.includes('spring')) frameworks.push('Spring');
      
      // Mobile
      if (text.includes('react native')) frameworks.push('React Native');
      if (text.includes('flutter')) frameworks.push('Flutter');
      if (text.includes('swift')) frameworks.push('Swift');
      
      // Data/ML
      if (text.includes('tensorflow') || text.includes('pytorch')) frameworks.push('ML/AI');
      if (text.includes('data') || text.includes('analytics')) tools.push('Data Science');
      
      // DevOps
      if (text.includes('docker')) tools.push('Docker');
      if (text.includes('kubernetes') || text.includes('k8s')) tools.push('Kubernetes');
      if (text.includes('aws') || text.includes('azure') || text.includes('gcp')) tools.push('Cloud');
    });

    // Trie les langages par fréquence
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      languages: topLanguages,
      frameworks: [...new Set(frameworks)].slice(0, 5),
      tools: [...new Set(tools)].slice(0, 5)
    };
  }

  /**
   * Calcule un score de qualité du profil
   */
  calculateQualityScore(user, repos) {
    let score = 0;

    // Followers (max 30 points)
    score += Math.min(user.followers / 10, 30);

    // Repos publics (max 20 points)
    score += Math.min(user.public_repos * 2, 20);

    // Repos avec stars (max 30 points)
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    score += Math.min(totalStars / 2, 30);

    // Activité récente (max 20 points)
    const recentActivity = repos.filter(repo => {
      const updated = new Date(repo.updated_at);
      const monthsAgo = (Date.now() - updated) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 6;  // Mis à jour dans les 6 derniers mois
    }).length;
    score += Math.min(recentActivity * 4, 20);

    return Math.round(score);
  }

  /**
   * Scraping principal
   */
  async scrape(params) {
    // 1. Recherche des utilisateurs
    const users = await this.searchUsers(params);

    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé');
      return;
    }

    // 2. Pour chaque utilisateur, récupère les détails
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      console.log(`👤 [${i + 1}/${users.length}] ${user.login}`);

      try {
        // Détails du profil
        const details = await this.getUserDetails(user.login);
        if (!details) continue;

        // Repos
        const repos = await this.getUserRepos(user.login);

        // Analyse des compétences
        const skills = this.analyzeSkills(repos);

        // Score de qualité
        const qualityScore = this.calculateQualityScore(details, repos);

        // Item complet
        const item = {
          // Infos personnelles
          username: details.login,
          nom: details.name,
          email: details.email,  // Souvent null (privé)
          bio: details.bio,
          localisation: details.location,
          entreprise: details.company,
          site_web: details.blog,
          twitter: details.twitter_username,
          
          // Stats GitHub
          repos_publics: details.public_repos,
          followers: details.followers,
          following: details.following,
          
          // Compétences détectées
          langages: skills.languages,
          frameworks: skills.frameworks,
          outils: skills.tools,
          
          // Qualité
          quality_score: qualityScore,
          
          // URLs
          github_url: details.html_url,
          avatar_url: details.avatar_url,
          
          // Métadonnées
          date_creation_compte: details.created_at,
          derniere_activite: details.updated_at,
          source: 'github'
        };

        // Filtre par compétences si demandé
        if (params.skills && params.skills.length > 0) {
          const hasRequiredSkills = params.skills.some(skill => 
            skills.languages.includes(skill) || 
            skills.frameworks.includes(skill) ||
            skills.tools.includes(skill)
          );

          if (!hasRequiredSkills) {
            console.log(`⏭️ Aucune compétence requise trouvée, skip`);
            continue;
          }
        }

        this.addResult(item);
      } catch (error) {
        this.handleError(error, `scrape user ${user.login}`);
      }

      // Délai entre utilisateurs (respect rate limit)
      if (i < users.length - 1) {
        await this.delay(1000, 2000);  // Plus court car API officielle
      }
    }
  }

  /**
   * Validation spécifique GitHub
   */
  validate(item) {
    const errors = [];

    if (!item.username) errors.push('Username manquant');
    if (!item.github_url) errors.push('URL GitHub manquante');
    if (!item.langages || item.langages.length === 0) errors.push('Aucun langage détecté');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transformation spécifique
   */
  transform(item) {
    const base = super.transform(item);
    
    return {
      ...base,
      // Normalisation
      nom: this.cleanText(item.nom),
      bio: this.cleanText(item.bio),
      localisation: this.cleanText(item.localisation),
      
      // Conversion arrays en JSON pour Supabase
      langages_json: JSON.stringify(item.langages),
      frameworks_json: JSON.stringify(item.frameworks),
      outils_json: JSON.stringify(item.outils),
      
      // Type de prospect
      type_prospect: 'developpeur',
      canal: 'github'
    };
  }
}

module.exports = GitHubScraper;
