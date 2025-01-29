-- Initialisation de la base de données pour la messagerie instantanée

-- Table pour les utilisateurs
CREATE TABLE users
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL, -- Hash du mot de passe
    first_name VARCHAR(50)  NOT NULL,
    last_name  VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les conversations
CREATE TABLE conversations
(
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100),                                         -- Nom de la conversation (utile pour les groupes)
    type       ENUM ('private', 'group') NOT NULL DEFAULT 'private', -- ENUM au lieu de CHECK
    created_at TIMESTAMP                          DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les messages
CREATE TABLE messages
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    content         TEXT                               NOT NULL,
    author_id       INT                                NOT NULL,
    conversation_id INT                                NOT NULL,
    created_at      TIMESTAMP                                   DEFAULT CURRENT_TIMESTAMP,
    read_at         TIMESTAMP                          NULL     DEFAULT NULL,   -- Ajout de la colonne pour marquer la lecture
    status          ENUM ('sent', 'read', 'delivered') NOT NULL DEFAULT 'sent', -- Ajout du statut du message
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
);

-- Table pour les participants des conversations
CREATE TABLE participants
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    conversation_id INT NOT NULL,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    UNIQUE (user_id, conversation_id) -- Empêche les doublons
);

-- Table pour stocker les notifications des messages non lus
CREATE TABLE notifications
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL, -- L'utilisateur qui doit recevoir la notification
    conversation_id INT NOT NULL, -- La conversation concernée
    message_id      INT NOT NULL, -- Le message lié à la notification
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
);
