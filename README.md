# 🐰 DiscordBotSpeaker Web — v2.1.0

Interface web locale pour parler dans Discord via ton bot.

## ⚠️ Sécurité

- **Ne jamais commiter `config.json`** — contient le token bot en clair.
- Le `.gitignore` fourni l'exclut automatiquement.
- Routes `/api/*` accessibles **uniquement depuis `localhost`**.

## Prérequis

- Bun 1.0+
- Un bot Discord avec son token

## Installation

```bash
bun install
bun start
```

Ouvre **http://localhost:3000** dans Waterfox.

## Fonctionnalités

### 💬 Messages
- Envoi texte + fichiers (jusqu'à 10, limite selon boost)
- **↩ Reply** — répondre à un message spécifique
- **✏️ Éditer** un message du bot inline (Entrée = sauver, Échap = annuler)
- **🗑 Supprimer** n'importe quel message (bouton au survol)
- **🎨 Embed builder** — titre, description, couleur, image, thumbnail, auteur, footer, champs inline
- **📋 Templates** — sauvegarder et recharger des messages/embeds en un clic
- Prévisualisation uploads + lightbox images

### 📁 Partage de documents (v1.4.0)
- **Tous types de fichiers** acceptés : PDF, Word, Excel, PowerPoint, ZIP, RAR, 7Z, TXT, CSV, JSON, code source, audio, exécutables…
- **Icônes colorées par type** dans la prévisualisation (📕 PDF, 📘 Word, 📗 Excel, 🗜️ Archives, 🎵 Audio…)
- Taille affichée avec alerte rouge si dépassement de la limite du serveur
- Nom de fichier tronqué affiché au survol

### 📊 Sondages
- Sondages natifs Discord (multiselect, durée, emojis)
- Terminer un sondage depuis l'interface

### 🧩 Composants V2
- Builder visuel : Texte, Séparateur, Boutons (×5), Section + accessoire
- Container optionnel, aperçu JSON temps réel

### ⚡ Performance
- **Cache API** en mémoire (guilds 2min, channels 2min, emojis 5min, me 5min)
- **Auto-refresh** configurable (15s / 30s / 1min / 2min / manuel)
- **Retry automatique** sur rate-limit Discord (429) avec backoff
- **Timeout 10s** sur tous les appels Discord API
- **Serveur natif Bun** (`Bun.serve()`) ultra rapide et sans dépendances NPM complexes

## Permissions Discord requises

- `View Channel`, `Send Messages`, `Read Message History`
- `Attach Files` — uploads
- `Manage Messages` — supprimer les messages des autres
- `Create Polls` — sondages

## Changelog

## [v2.1.0] - 2026-03-20
### Ajouté
- Réparation de l'affichage des messages épinglés (rendu Markdown).
- Accès au chat textuel des salons vocaux.
- Réorganisation des salons par Drag & Drop.
- Système d'autocomplétion des mentions (`@` / `#`).
- Panneau latéral droit listant les membres du serveur et leurs rôles.
- Fonctionnalité de Messages Privés (MP) aux utilisateurs.
- Options de serveur (nom, icône).
- Édition du profil du bot (nom, avatar, bio, statut et activité).

### Corrigé
- Problème de chargement de la police d'écriture `gg sans`.
- Correction de l'erreur JavaScript `_openGuildEdit` au démarrage de la page.
- Affichage de l'indicateur visuel pour le Drag & Drop.
- Résolution du problème d'affichage des photos de profil (format `.webp` et ID des utilisateurs).

## [v2.0.0] - Refonte Complète (Bun & TypeScript)
### Ajouté
- **Environnement Bun** : Migration complète vers Bun comme environnement d'exécution et gestionnaire de paquets (0 dépendance NPM, utilisation de `Bun.serve()`, `fetch`, etc.).
- **Architecture Modulaire TypeScript** : Réécriture du backend avec TypeScript strict (`src/`) et un routage organisé (`router.ts`, `lib/`, `routes/`, `types/`).
- **Frontend ES Modules** : Découpage du frontend en modules JavaScript natifs (`public/modules/`) orchestrés par `main.js`.
- **Interface UI/UX Discord-like** : Nouvelle interface fidèle à Discord (layout à 3 colonnes, liste des serveurs, salon sidebar avec catégories repliables).
- **Rendu visuel des Embeds** : Affichage complet des embeds (barre de couleur, auteur, titre, description, champs inline, miniature, image, pied de page).
- **Commandes Slash (`/`)** : Support intégré des commandes slash du bot avec un menu popup d'autocomplétion textuelle.
- **Édition de Salon** : Nouvelle modale pour modifier rapidement le nom, le sujet, le mode lent et le statut NSFW d'un salon.
- **Messages Épinglés** : Nouvelle fonctionnalité et modale pour consulter les messages épinglés d'un salon.
- **Sécurité et Optimisation** : Limiteur de débit (rate limiting) par IP, sécurité renforcée (uniquement localhost), validation stricte des IDs Discord (Snowflake), et cache TTL en mémoire pour minimiser les appels à l'API Discord.
- **Sondages et Composants interactifs** : Ajout d'une interface robuste pour la création de sondages Discord et l'envoi de composants (boutons).

### v1.4.0
- **📁 Tous types de fichiers** — PDF, Word, Excel, PowerPoint, ZIP, archives, code, audio, etc.
- **Icônes colorées** par type de fichier dans la prévisualisation
- Affichage de la taille formatée (KB / MB) avec alerte si dépassement limite
- Suppression du filtre `accept` restrictif sur l'input fichier

### v1.3.0
- **↩ Reply** — répondre à un message avec barre de contexte
- **✏️ Éditer** — édition inline des messages du bot
- **🎨 Embed builder** complet (9 champs + champs inline)
- **📋 Templates** — sauvegarde/chargement persistant (templates.json)
- **⏱ Auto-refresh** configurable dans la barre de salon
- **Cache API** en mémoire avec TTL par type de donnée
- **Retry 429** avec backoff exponentiel
- **Gzip** compression Express
- Reset propre de tous les états au disconnect

### v1.2.0
- Builder Components V2 (onglet 🧩)
- Suppression de messages (bouton 🗑)
- Handler 204 Discord

### v1.1.0
- Middleware localhost, .gitignore, timeout 10s

### v1.0.0
- Version initiale
