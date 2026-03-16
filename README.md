# BulkSMS Platform

Plateforme de communication SMS en masse pour Djibouti.

## Stack Technique

- **Frontend** : React 18, Bootstrap 5, Chart.js
- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL + Sequelize ORM
- **SMS** : Infobip API
- **Auth** : JWT
- **i18n** : Français + Anglais

## Installation

### Prérequis

- Node.js >= 18
- PostgreSQL >= 14

### 1. Base de données

```sql
CREATE DATABASE bulksms_db;
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Modifier .env avec vos paramètres
npm run db:sync
npm run db:seed
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm start
```

## Connexion par défaut

- **URL** : http://localhost:3000
- **Super Admin** : admin@bulksms.dj / Admin@1234

## Variables d'environnement (.env)

| Variable | Description |
|----------|-------------|
| DB_* | Connexion PostgreSQL |
| JWT_SECRET | Clé secrète JWT |
| INFOBIP_API_KEY | Clé API Infobip |
| INFOBIP_BASE_URL | URL de base Infobip |
| SMTP_* | Configuration email |
| CLIENT_URL | URL du frontend |

## Structure

```
BulkSms/
├── server/           # API Node.js/Express
│   └── src/
│       ├── models/   # Modèles Sequelize
│       ├── controllers/
│       ├── routes/
│       ├── services/ # SMS, Email, Scheduler
│       └── scripts/  # DB sync & seed
└── client/           # React App
    └── src/
        ├── pages/    # admin/ & client/
        ├── components/
        ├── contexts/
        └── services/
```
