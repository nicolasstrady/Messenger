# Utiliser l'image Node.js officielle
FROM node:16

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Exposer le port utilisé par Socket.IO
EXPOSE 8081

# Commande par défaut pour démarrer le serveur
CMD ["node", "server.js"]
