# Étape 1 : Construire l'application
FROM node:lts-alpine

WORKDIR /app

# Copier le package.json et package-lock.json
COPY package.json package.json

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY public public
COPY tsconfig.json tsconfig.json
COPY eslint.config.mjs eslint.config.mjs
COPY next.config.ts next.config.ts
COPY tailwind.config.ts tailwind.config.ts
COPY postcss.config.mjs postcss.config.mjs
COPY src src

EXPOSE 3000

CMD npm run dev
