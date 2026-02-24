// pages/mentions-legales.js
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function MentionsLegales() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Mentions légales — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: rgba(8,8,9,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: #d4a853; font-style: italic; cursor: pointer; }
        .nav-back { background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .nav-back:hover { color: #e8e8e8; border-color: rgba(255,255,255,0.25); }

        .page { max-width: 780px; margin: 0 auto; padding: 120px 48px 80px; position: relative; z-index: 1; }

        .page-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(212,168,83,0.08); border: 1px solid rgba(212,168,83,0.2); border-radius: 30px; padding: 5px 14px; font-size: 11px; color: #d4a853; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 4vw, 52px); font-weight: 300; color: #f0f0f0; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 12px; }
        .page-title em { font-style: italic; background: linear-gradient(135deg, #8b6914, #d4a853); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .page-date { font-size: 12px; color: rgba(255,255,255,0.2); margin-bottom: 56px; letter-spacing: 0.5px; }

        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 48px 0; }

        .section { margin-bottom: 48px; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: #d4a853; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(212,168,83,0.15); }
        .section p { font-size: 14.5px; color: rgba(255,255,255,0.5); line-height: 1.85; margin-bottom: 14px; font-weight: 300; }
        .section p:last-child { margin-bottom: 0; }
        .section strong { color: rgba(255,255,255,0.75); font-weight: 500; }
        .section a { color: #d4a853; text-decoration: none; }
        .section a:hover { text-decoration: underline; }

        .info-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px 24px; margin-bottom: 14px; }
        .info-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 14px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: rgba(255,255,255,0.3); min-width: 160px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 2px; }
        .info-value { color: rgba(255,255,255,0.65); font-weight: 300; }

        .footer { margin-top: 80px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 16px; color: rgba(212,168,83,0.5); font-style: italic; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 12px; color: rgba(255,255,255,0.2); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .nav { padding: 16px 24px; }
          .page { padding: 100px 24px 60px; }
          .info-row { flex-direction: column; gap: 2px; }
          .info-label { min-width: unset; }
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => router.push('/')}>ProspectBot</div>
        <button className="nav-back" onClick={() => router.back()}>← Retour</button>
      </nav>

      <div className="page">

        <div className="page-tag">Informations légales</div>
        <h1 className="page-title">Mentions <em>légales</em></h1>
        <p className="page-date">Dernière mise à jour : janvier 2025</p>

        {/* Éditeur */}
        <div className="section">
          <h2 className="section-title">1. Éditeur du site</h2>
          <div className="info-block">
            <div className="info-row">
              <span className="info-label">Société</span>
              <span className="info-value">ProspectBot SAS</span>
            </div>
            <div className="info-row">
              <span className="info-label">Forme juridique</span>
              <span className="info-value">Société par Actions Simplifiée (SAS)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Capital social</span>
              <span className="info-value">1 000 €</span>
            </div>
            <div className="info-row">
              <span className="info-label">SIRET</span>
              <span className="info-value">En cours d'immaticulation</span>
            </div>
            <div className="info-row">
              <span className="info-label">Siège social</span>
              <span className="info-value">2 place du marché</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value"><a href="mailto:contact@prospectbot.fr">contact@prospectbot.fr</a></span>
            </div>
            <div className="info-row">
              <span className="info-label">Directeur de publication</span>
              <span className="info-value">Victor MARTIN</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Hébergement */}
        <div className="section">
          <h2 className="section-title">2. Hébergement</h2>
          <div className="info-block">
            <div className="info-row">
              <span className="info-label">Hébergeur</span>
              <span className="info-value">Vercel Inc.</span>
            </div>
            <div className="info-row">
              <span className="info-label">Adresse</span>
              <span className="info-value">340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</span>
            </div>
            <div className="info-row">
              <span className="info-label">Site</span>
              <span className="info-value"><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></span>
            </div>
          </div>
          <div className="info-block">
            <div className="info-row">
              <span className="info-label">Base de données</span>
              <span className="info-value">Supabase Inc.</span>
            </div>
            <div className="info-row">
              <span className="info-label">Site</span>
              <span className="info-value"><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Propriété intellectuelle */}
        <div className="section">
          <h2 className="section-title">3. Propriété intellectuelle</h2>
          <p>L'ensemble des éléments composant le site ProspectBot (textes, graphismes, logiciels, images, sons, vidéos, base de données, etc.) sont la propriété exclusive de <strong>ProspectBot SAS</strong> ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
          <p>Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de ProspectBot SAS.</p>
        </div>

        <div className="divider" />

        {/* Données personnelles */}
        <div className="section">
          <h2 className="section-title">4. Données personnelles</h2>
          <p>ProspectBot SAS collecte et traite des données personnelles dans le cadre de la fourniture de ses services. Ces données sont traitées conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> et à la loi Informatique et Libertés.</p>
          <p><strong>Données collectées :</strong> nom, adresse email, mot de passe (chiffré), informations de facturation (gérées par Stripe).</p>
          <p><strong>Finalité :</strong> création et gestion de compte, facturation, amélioration du service.</p>
          <p><strong>Conservation :</strong> les données sont conservées pendant toute la durée du contrat et 3 ans après sa résiliation.</p>
          <p>Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@prospectbot.fr">contact@prospectbot.fr</a>.</p>
        </div>

        <div className="divider" />

        {/* Cookies */}
        <div className="section">
          <h2 className="section-title">5. Cookies</h2>
          <p>Le site ProspectBot utilise des cookies strictement nécessaires au fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
          <p>Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait empêcher l'accès à certaines fonctionnalités du service.</p>
        </div>

        <div className="divider" />

        {/* Paiement */}
        <div className="section">
          <h2 className="section-title">6. Paiement et abonnements</h2>
          <p>Les paiements sont gérés par <strong>Stripe Inc.</strong>, prestataire certifié PCI-DSS. ProspectBot SAS ne stocke aucune donnée bancaire sur ses serveurs.</p>
          <p>Les abonnements sont souscrits pour une durée mensuelle ou annuelle et se renouvellent automatiquement. Vous pouvez résilier à tout moment depuis votre espace abonné, sans frais supplémentaires. La résiliation prend effet à la fin de la période en cours.</p>
          <p>Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques dont l'exécution a commencé avec votre accord.</p>
        </div>

        <div className="divider" />

        {/* Responsabilité */}
        <div className="section">
          <h2 className="section-title">7. Limitation de responsabilité</h2>
          <p>ProspectBot SAS s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, ProspectBot SAS ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées.</p>
          <p>ProspectBot SAS ne saurait être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications techniques requises, soit de l'apparition d'un bug ou d'une incompatibilité.</p>
          <p>Les données de scraping proviennent de sites tiers. ProspectBot SAS ne peut être tenu responsable de l'exactitude, de la disponibilité ou de la légalité des annonces collectées sur ces plateformes.</p>
        </div>

        <div className="divider" />

        {/* Droit applicable */}
        <div className="section">
          <h2 className="section-title">8. Droit applicable et juridiction</h2>
          <p>Les présentes mentions légales sont régies par le <strong>droit français</strong>. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.</p>
          <p>Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à <a href="mailto:contact@prospectbot.fr">contact@prospectbot.fr</a>.</p>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="footer-logo">ProspectBot</div>
          <div className="footer-links">
            <a href="/" className="footer-link">Accueil</a>
            <a href="/login" className="footer-link">Connexion</a>
            <a href="mailto:contact@prospectbot.fr" className="footer-link">Contact</a>
          </div>
        </div>

      </div>
    </>
  );
}
