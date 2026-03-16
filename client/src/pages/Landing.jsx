import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const T = {
  fr: {
    nav: {
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      contact: 'Contact',
      login: 'Connexion',
      demo: 'Demander une démo',
    },
    hero: {
      badge: 'Plateforme SMS #1 à Djibouti',
      title: 'Envoyez des SMS en masse,',
      title2: 'simplement et rapidement.',
      subtitle: 'BulkSMS est la solution professionnelle pour communiquer avec vos clients par SMS. Gérez vos campagnes, suivez vos statistiques et développez votre business.',
      cta_primary: 'Demander une démo gratuite',
      cta_secondary: 'Voir les tarifs',
    },
    stats: [
      { value: '98.7%', label: 'Taux de livraison' },
      { value: '< 3s', label: "Délai d'envoi" },
      { value: '24/7', label: 'Support disponible' },
      { value: '100%', label: 'Réseau local DJ' },
    ],
    features: {
      title: 'Tout ce dont vous avez besoin',
      subtitle: 'Une plateforme complète pour gérer vos communications SMS professionnelles.',
      items: [
        { icon: 'bi-send-fill', title: 'Envoi en masse', desc: "Envoyez des milliers de SMS en quelques clics. Importez vos contacts depuis Excel ou CSV." },
        { icon: 'bi-calendar-check', title: 'Planification', desc: "Programmez vos campagnes à l'avance. Définissez la date et l'heure d'envoi." },
        { icon: 'bi-bar-chart-line-fill', title: 'Statistiques détaillées', desc: "Suivez en temps réel les taux de livraison, d'ouverture et les performances de vos campagnes." },
        { icon: 'bi-people-fill', title: 'Multi-utilisateurs', desc: "Gérez plusieurs équipes avec des rôles distincts. Administrateur, manager ou opérateur." },
        { icon: 'bi-person-badge-fill', title: 'Sender ID personnalisé', desc: "Envoyez des SMS avec le nom de votre entreprise comme expéditeur." },
        { icon: 'bi-file-earmark-text-fill', title: 'Templates de messages', desc: "Créez des modèles réutilisables avec des variables de personnalisation." },
      ],
    },
    how: {
      title: 'Comment ça fonctionne ?',
      subtitle: 'En 3 étapes simples, commencez à envoyer vos SMS professionnels.',
      steps: [
        { num: '01', title: 'Créez votre compte', desc: "Contactez-nous pour ouvrir votre compte. Configuration en moins de 24h." },
        { num: '02', title: 'Achetez des crédits', desc: "Choisissez votre package SMS via Waafi Pay. Paiement mobile simple et sécurisé." },
        { num: '03', title: 'Envoyez vos campagnes', desc: "Importez vos contacts, rédigez votre message et envoyez. Simple comme ça." },
      ],
    },
    pricing: {
      title: 'Des tarifs adaptés à votre activité',
      subtitle: 'Choisissez le package qui correspond à vos besoins. Tous les packages incluent les fonctionnalités complètes.',
      popular: 'Populaire',
      sms: 'SMS',
      validity: 'Validité 1 an',
      cta: 'Choisir ce package',
      contact_us: 'Nous contacter',
      packages: [
        { name: 'Starter', sms: '500', price: '5 000', currency: 'DJF', desc: 'Idéal pour débuter' },
        { name: 'Business', sms: '2 000', price: '17 000', currency: 'DJF', desc: 'Pour les PME', featured: true },
        { name: 'Pro', sms: '10 000', price: '75 000', currency: 'DJF', desc: 'Pour les grandes entreprises' },
        { name: 'Enterprise', sms: '50 000', price: '300 000', currency: 'DJF', desc: 'Volume sur mesure' },
      ],
    },
    testimonials: {
      title: 'Ils nous font confiance',
      items: [
        { name: 'Ahmed Hassan', company: 'Dahabshiil Djibouti', text: 'BulkSMS nous a permis d\'améliorer considérablement notre communication client. Les taux de livraison sont excellents et la plateforme est très facile à utiliser.', avatar: 'AH' },
        { name: 'Fatouma Ali', company: 'Retail+ Djibouti', text: 'Nous utilisons BulkSMS pour nos promotions et nos alertes clients. Le support est réactif et les prix sont compétitifs par rapport aux solutions internationales.', avatar: 'FA' },
        { name: 'Mohamed Youssouf', company: 'Hotel Sheraton Djibouti', text: 'Grâce à BulkSMS, nous envoyons des confirmations de réservation et des rappels automatiques. Nos clients apprécient cette communication personnalisée.', avatar: 'MY' },
      ],
    },
    contact: {
      title: 'Prêt à commencer ?',
      subtitle: 'Demandez une démonstration gratuite. Notre équipe vous contacte dans les 24h.',
      form: {
        name: 'Votre nom',
        company: 'Nom de votre entreprise',
        email: 'Adresse email',
        phone: 'Téléphone (optionnel)',
        message: 'Votre message',
        submit: 'Envoyer la demande',
        sending: 'Envoi en cours...',
        success: 'Message envoyé ! Nous vous contactons dans les 24h.',
        placeholder_message: 'Décrivez votre besoin (volume SMS mensuel estimé, secteur d\'activité...)',
      },
    },
    footer: {
      tagline: 'La plateforme SMS professionnelle pour Djibouti et l\'Afrique de l\'Est.',
      links_title: 'Liens rapides',
      legal_title: 'Légal',
      contact_title: 'Contact',
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      login: 'Connexion',
      privacy: 'Politique de confidentialité',
      terms: 'Conditions d\'utilisation',
      copyright: '© 2026 BulkSMS Platform. Tous droits réservés.',
    },
  },
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact',
      login: 'Login',
      demo: 'Request a demo',
    },
    hero: {
      badge: '#1 SMS Platform in Djibouti',
      title: 'Send bulk SMS,',
      title2: 'simply and fast.',
      subtitle: 'BulkSMS is the professional solution to communicate with your customers via SMS. Manage your campaigns, track your stats and grow your business.',
      cta_primary: 'Request a free demo',
      cta_secondary: 'View pricing',
    },
    stats: [
      { value: '98.7%', label: 'Delivery rate' },
      { value: '< 3s', label: 'Send time' },
      { value: '24/7', label: 'Support available' },
      { value: '100%', label: 'Local DJ network' },
    ],
    features: {
      title: 'Everything you need',
      subtitle: 'A complete platform to manage your professional SMS communications.',
      items: [
        { icon: 'bi-send-fill', title: 'Bulk sending', desc: 'Send thousands of SMS in a few clicks. Import contacts from Excel or CSV.' },
        { icon: 'bi-calendar-check', title: 'Scheduling', desc: 'Schedule your campaigns in advance. Set the date and time of sending.' },
        { icon: 'bi-bar-chart-line-fill', title: 'Detailed analytics', desc: 'Track delivery rates and campaign performance in real time.' },
        { icon: 'bi-people-fill', title: 'Multi-user', desc: 'Manage multiple teams with distinct roles. Admin, manager or operator.' },
        { icon: 'bi-person-badge-fill', title: 'Custom Sender ID', desc: 'Send SMS with your company name as the sender.' },
        { icon: 'bi-file-earmark-text-fill', title: 'Message templates', desc: 'Create reusable templates with personalization variables.' },
      ],
    },
    how: {
      title: 'How does it work?',
      subtitle: 'In 3 simple steps, start sending your professional SMS.',
      steps: [
        { num: '01', title: 'Create your account', desc: 'Contact us to open your account. Setup in less than 24h.' },
        { num: '02', title: 'Buy credits', desc: 'Choose your SMS package via Waafi Pay. Simple and secure mobile payment.' },
        { num: '03', title: 'Send your campaigns', desc: 'Import your contacts, write your message and send. Simple as that.' },
      ],
    },
    pricing: {
      title: 'Pricing tailored to your business',
      subtitle: 'Choose the package that fits your needs. All packages include full features.',
      popular: 'Popular',
      sms: 'SMS',
      validity: '1 year validity',
      cta: 'Choose this package',
      contact_us: 'Contact us',
      packages: [
        { name: 'Starter', sms: '500', price: '5,000', currency: 'DJF', desc: 'Ideal for getting started' },
        { name: 'Business', sms: '2,000', price: '17,000', currency: 'DJF', desc: 'For SMEs', featured: true },
        { name: 'Pro', sms: '10,000', price: '75,000', currency: 'DJF', desc: 'For large companies' },
        { name: 'Enterprise', sms: '50,000', price: '300,000', currency: 'DJF', desc: 'Custom volume' },
      ],
    },
    testimonials: {
      title: 'They trust us',
      items: [
        { name: 'Ahmed Hassan', company: 'Dahabshiil Djibouti', text: 'BulkSMS has considerably improved our customer communication. Delivery rates are excellent and the platform is very easy to use.', avatar: 'AH' },
        { name: 'Fatouma Ali', company: 'Retail+ Djibouti', text: 'We use BulkSMS for promotions and customer alerts. Support is responsive and prices are competitive compared to international solutions.', avatar: 'FA' },
        { name: 'Mohamed Youssouf', company: 'Hotel Sheraton Djibouti', text: 'Thanks to BulkSMS, we send booking confirmations and automatic reminders. Our customers appreciate this personalized communication.', avatar: 'MY' },
      ],
    },
    contact: {
      title: 'Ready to get started?',
      subtitle: 'Request a free demo. Our team contacts you within 24 hours.',
      form: {
        name: 'Your name',
        company: 'Company name',
        email: 'Email address',
        phone: 'Phone (optional)',
        message: 'Your message',
        submit: 'Send request',
        sending: 'Sending...',
        success: 'Message sent! We will contact you within 24 hours.',
        placeholder_message: 'Describe your need (estimated monthly SMS volume, industry...)',
      },
    },
    footer: {
      tagline: 'The professional SMS platform for Djibouti and East Africa.',
      links_title: 'Quick links',
      legal_title: 'Legal',
      contact_title: 'Contact',
      features: 'Features',
      pricing: 'Pricing',
      login: 'Login',
      privacy: 'Privacy policy',
      terms: 'Terms of service',
      copyright: '© 2026 BulkSMS Platform. All rights reserved.',
    },
  },
};

export default function Landing() {
  const [lang, setLang] = useState(() => localStorage.getItem('i18nextLng')?.startsWith('en') ? 'en' : 'fr');
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle'); // idle | sending | success
  const t = T[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => {
    const next = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    localStorage.setItem('i18nextLng', next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    // Simulate sending (replace with real API call)
    await new Promise(r => setTimeout(r, 1500));
    setFormStatus('success');
  };

  return (
    <div className="lp-root">
      {/* ── NAVBAR ── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner">
          <a href="#hero" className="lp-nav__brand">
            <div className="lp-nav__logo"><i className="bi bi-chat-dots-fill" /></div>
            <span>BulkSMS</span>
          </a>
          <div className="lp-nav__links">
            <a href="#features">{t.nav.features}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#contact">{t.nav.contact}</a>
          </div>
          <div className="lp-nav__actions">
            <button className="lp-btn-lang" onClick={toggleLang}>
              {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
            <Link to="/login" className="lp-btn-outline">{t.nav.login}</Link>
            <a href="#contact" className="lp-btn-primary">{t.nav.demo}</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero__bg">
          <div className="lp-hero__orb lp-hero__orb--1" />
          <div className="lp-hero__orb lp-hero__orb--2" />
          <div className="lp-hero__orb lp-hero__orb--3" />
          <div className="lp-hero__grid" />
        </div>
        <div className="lp-container">
          <div className="lp-hero__content">
            <div className="lp-hero__badge">
              <span className="lp-hero__badge-dot" />
              {t.hero.badge}
            </div>
            <h1 className="lp-hero__title">
              {t.hero.title}<br />
              <span className="lp-hero__title-gradient">{t.hero.title2}</span>
            </h1>
            <p className="lp-hero__subtitle">{t.hero.subtitle}</p>
            <div className="lp-hero__cta">
              <a href="#contact" className="lp-btn-hero-primary">
                <i className="bi bi-rocket-takeoff-fill me-2" />
                {t.hero.cta_primary}
              </a>
              <a href="#pricing" className="lp-btn-hero-secondary">
                {t.hero.cta_secondary}
                <i className="bi bi-arrow-right ms-2" />
              </a>
            </div>
            <div className="lp-hero__stats">
              {t.stats.map((s, i) => (
                <div key={i} className="lp-hero__stat">
                  <div className="lp-hero__stat-value">{s.value}</div>
                  <div className="lp-hero__stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-hero__visual">
            <div className="lp-phone">
              <div className="lp-phone__screen">
                <div className="lp-phone__header">
                  <div className="lp-phone__notch" />
                </div>
                <div className="lp-phone__content">
                  <div className="lp-phone__app-bar">
                    <div className="lp-phone__app-icon"><i className="bi bi-chat-dots-fill" /></div>
                    <div>
                      <div className="lp-phone__app-name">BulkSMS</div>
                      <div className="lp-phone__app-sub">Campaign Manager</div>
                    </div>
                  </div>
                  <div className="lp-phone__msg lp-phone__msg--sent">
                    <div className="lp-phone__msg-text">Bonjour {'{prenom}'}, votre commande #1234 est confirmée !</div>
                    <div className="lp-phone__msg-meta">✓✓ 14:32</div>
                  </div>
                  <div className="lp-phone__msg lp-phone__msg--sent">
                    <div className="lp-phone__msg-text">Promotion spéciale : -20% sur tout le catalogue ce weekend !</div>
                    <div className="lp-phone__msg-meta">✓✓ 14:32</div>
                  </div>
                  <div className="lp-phone__stats-mini">
                    <div className="lp-phone__stats-row">
                      <span>Envoyés</span><span className="text-success">1,247</span>
                    </div>
                    <div className="lp-phone__progress">
                      <div className="lp-phone__progress-bar" style={{width:'98%'}} />
                    </div>
                    <div className="lp-phone__stats-row">
                      <span>Livrés</span><span className="text-success">98.7%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-phone__float lp-phone__float--1">
                <i className="bi bi-check-circle-fill text-success" /> 1,247 SMS livrés
              </div>
              <div className="lp-phone__float lp-phone__float--2">
                <i className="bi bi-lightning-charge-fill text-warning" /> Envoyé en 2.1s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section lp-section--white">
        <div className="lp-container">
          <div className="lp-section__header">
            <div className="lp-section__badge">{lang === 'fr' ? 'Fonctionnalités' : 'Features'}</div>
            <h2 className="lp-section__title">{t.features.title}</h2>
            <p className="lp-section__subtitle">{t.features.subtitle}</p>
          </div>
          <div className="lp-features__grid">
            {t.features.items.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-card__icon">
                  <i className={`bi ${f.icon}`} />
                </div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-section--gray">
        <div className="lp-container">
          <div className="lp-section__header">
            <div className="lp-section__badge">{lang === 'fr' ? 'Simple' : 'Simple'}</div>
            <h2 className="lp-section__title">{t.how.title}</h2>
            <p className="lp-section__subtitle">{t.how.subtitle}</p>
          </div>
          <div className="lp-how__grid">
            {t.how.steps.map((s, i) => (
              <div key={i} className="lp-how-step">
                <div className="lp-how-step__num">{s.num}</div>
                <div className="lp-how-step__connector" />
                <h3 className="lp-how-step__title">{s.title}</h3>
                <p className="lp-how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-section lp-section--white">
        <div className="lp-container">
          <div className="lp-section__header">
            <div className="lp-section__badge">{lang === 'fr' ? 'Tarifs' : 'Pricing'}</div>
            <h2 className="lp-section__title">{t.pricing.title}</h2>
            <p className="lp-section__subtitle">{t.pricing.subtitle}</p>
          </div>
          <div className="lp-pricing__grid">
            {t.pricing.packages.map((pkg, i) => (
              <div key={i} className={`lp-price-card ${pkg.featured ? 'lp-price-card--featured' : ''}`}>
                {pkg.featured && <div className="lp-price-card__badge">{t.pricing.popular}</div>}
                <div className="lp-price-card__name">{pkg.name}</div>
                <div className="lp-price-card__desc">{pkg.desc}</div>
                <div className="lp-price-card__sms">
                  <span className="lp-price-card__sms-num">{pkg.sms}</span>
                  <span className="lp-price-card__sms-label"> {t.pricing.sms}</span>
                </div>
                <div className="lp-price-card__price">
                  <span className="lp-price-card__price-num">{pkg.price}</span>
                  <span className="lp-price-card__price-cur"> {pkg.currency}</span>
                </div>
                <div className="lp-price-card__validity">
                  <i className="bi bi-check2 me-1" />{t.pricing.validity}
                </div>
                <ul className="lp-price-card__features">
                  <li><i className="bi bi-check2-circle" /> {lang === 'fr' ? 'Toutes les fonctionnalités' : 'All features'}</li>
                  <li><i className="bi bi-check2-circle" /> {lang === 'fr' ? 'Support prioritaire' : 'Priority support'}</li>
                  <li><i className="bi bi-check2-circle" /> {lang === 'fr' ? 'Statistiques avancées' : 'Advanced analytics'}</li>
                  <li><i className="bi bi-check2-circle" /> {lang === 'fr' ? 'Sender ID personnalisé' : 'Custom Sender ID'}</li>
                </ul>
                <a href="#contact" className={`lp-price-card__cta ${pkg.featured ? 'lp-price-card__cta--featured' : ''}`}>
                  {t.pricing.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section lp-section--dark">
        <div className="lp-container">
          <div className="lp-section__header lp-section__header--dark">
            <div className="lp-section__badge lp-section__badge--dark">{lang === 'fr' ? 'Témoignages' : 'Testimonials'}</div>
            <h2 className="lp-section__title lp-section__title--white">{t.testimonials.title}</h2>
          </div>
          <div className="lp-testimonials__grid">
            {t.testimonials.items.map((item, i) => (
              <div key={i} className="lp-testimonial-card">
                <div className="lp-testimonial-card__stars">
                  {[1,2,3,4,5].map(s => <i key={s} className="bi bi-star-fill" />)}
                </div>
                <p className="lp-testimonial-card__text">"{item.text}"</p>
                <div className="lp-testimonial-card__author">
                  <div className="lp-testimonial-card__avatar">{item.avatar}</div>
                  <div>
                    <div className="lp-testimonial-card__name">{item.name}</div>
                    <div className="lp-testimonial-card__company">{item.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="lp-section lp-section--white">
        <div className="lp-container">
          <div className="lp-contact__grid">
            <div className="lp-contact__left">
              <div className="lp-section__badge">{lang === 'fr' ? 'Contact' : 'Contact'}</div>
              <h2 className="lp-section__title lp-section__title--left">{t.contact.title}</h2>
              <p className="lp-section__subtitle lp-section__subtitle--left">{t.contact.subtitle}</p>
              <div className="lp-contact__info">
                <div className="lp-contact__info-item">
                  <div className="lp-contact__info-icon"><i className="bi bi-envelope-fill" /></div>
                  <div>
                    <div className="lp-contact__info-label">Email</div>
                    <div className="lp-contact__info-value">contact@bulksms.dj</div>
                  </div>
                </div>
                <div className="lp-contact__info-item">
                  <div className="lp-contact__info-icon"><i className="bi bi-telephone-fill" /></div>
                  <div>
                    <div className="lp-contact__info-label">{lang === 'fr' ? 'Téléphone' : 'Phone'}</div>
                    <div className="lp-contact__info-value">+253 77 XX XX XX</div>
                  </div>
                </div>
                <div className="lp-contact__info-item">
                  <div className="lp-contact__info-icon"><i className="bi bi-geo-alt-fill" /></div>
                  <div>
                    <div className="lp-contact__info-label">{lang === 'fr' ? 'Adresse' : 'Address'}</div>
                    <div className="lp-contact__info-value">Djibouti-Ville, Djibouti</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-contact__right">
              {formStatus === 'success' ? (
                <div className="lp-contact__success">
                  <div className="lp-contact__success-icon"><i className="bi bi-check-circle-fill" /></div>
                  <h3>{lang === 'fr' ? 'Message envoyé !' : 'Message sent!'}</h3>
                  <p>{t.contact.form.success}</p>
                </div>
              ) : (
                <form className="lp-contact__form" onSubmit={handleSubmit}>
                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>{t.contact.form.name} *</label>
                      <input type="text" required placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="lp-form-group">
                      <label>{t.contact.form.company} *</label>
                      <input type="text" required placeholder="Ma société" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                  </div>
                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>{t.contact.form.email} *</label>
                      <input type="email" required placeholder="email@exemple.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="lp-form-group">
                      <label>{t.contact.form.phone}</label>
                      <input type="tel" placeholder="+253 77 XX XX XX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="lp-form-group">
                    <label>{t.contact.form.message}</label>
                    <textarea rows={4} placeholder={t.contact.form.placeholder_message} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                  </div>
                  <button type="submit" className="lp-btn-form-submit" disabled={formStatus === 'sending'}>
                    {formStatus === 'sending' ? (
                      <><span className="lp-spinner" /> {t.contact.form.sending}</>
                    ) : (
                      <><i className="bi bi-send-fill me-2" />{t.contact.form.submit}</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <div className="lp-footer__logo">
                <div className="lp-nav__logo"><i className="bi bi-chat-dots-fill" /></div>
                <span>BulkSMS</span>
              </div>
              <p className="lp-footer__tagline">{t.footer.tagline}</p>
            </div>
            <div className="lp-footer__col">
              <h4>{t.footer.links_title}</h4>
              <a href="#features">{t.footer.features}</a>
              <a href="#pricing">{t.footer.pricing}</a>
              <Link to="/login">{t.footer.login}</Link>
            </div>
            <div className="lp-footer__col">
              <h4>{t.footer.legal_title}</h4>
              <a href="#contact">{t.footer.privacy}</a>
              <a href="#contact">{t.footer.terms}</a>
            </div>
            <div className="lp-footer__col">
              <h4>{t.footer.contact_title}</h4>
              <a href="mailto:contact@bulksms.dj">contact@bulksms.dj</a>
              <span>+253 77 XX XX XX</span>
              <span>Djibouti-Ville</span>
            </div>
          </div>
          <div className="lp-footer__bottom">
            <span>{t.footer.copyright}</span>
            <div className="lp-footer__bottom-lang">
              <button onClick={toggleLang} className="lp-btn-lang-footer">
                {lang === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
