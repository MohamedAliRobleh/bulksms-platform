-- ═══════════════════════════════════════════════════════════
--  BulkSMS Platform — Script d'initialisation PostgreSQL
--  Exécuter ce script dans pgAdmin ou psql en tant que superuser
-- ═══════════════════════════════════════════════════════════

-- 1. Créer la base de données
CREATE DATABASE bulksms_db
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 2. Créer l'utilisateur applicatif (optionnel mais recommandé)
-- Remplacez 'votre_mot_de_passe' par un mot de passe fort
CREATE USER bulksms_user WITH PASSWORD 'votre_mot_de_passe';

-- 3. Donner les droits à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE bulksms_db TO bulksms_user;

-- ───────────────────────────────────────────────────────────
-- SE CONNECTER À LA BASE bulksms_db avant d'exécuter la suite
-- Dans pgAdmin : cliquez sur bulksms_db puis ouvrez Query Tool
-- En psql : \c bulksms_db
-- ───────────────────────────────────────────────────────────

-- 4. Activer l'extension UUID (nécessaire pour les IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. Activer l'extension pour les recherches insensibles à la casse
CREATE EXTENSION IF NOT EXISTS "citext";

-- ───────────────────────────────────────────────────────────
-- TABLES (créées automatiquement par Sequelize au démarrage)
-- Le serveur Node.js crée toutes les tables via : npm run db:sync
-- Ce script crée uniquement la DB et les extensions requises
-- ───────────────────────────────────────────────────────────

-- Vérification finale
SELECT version();
SELECT current_database();
