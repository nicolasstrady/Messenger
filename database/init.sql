-- Initialisation de la base de données pour la messagerie instantanée

-- Table pour les utilisateurs
CREATE TABLE users
(
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL, -- Hash du mot de passe
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    profile_image VARCHAR(255) NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Insertion de données d'exemple
INSERT INTO users (username, email, password, first_name, last_name, profile_image) VALUES
    ('alice.leroy', 'alice@example.com', 'hash1', 'Alice', 'Leroy', NULL),
    ('benjamin.dubois', 'benjamin@example.com', 'hash2', 'Benjamin', 'Dubois', NULL),
    ('chloe.martin', 'chloe@example.com', 'hash3', 'Chloé', 'Martin', NULL),
    ('damien.lefebvre', 'damien@example.com', 'hash4', 'Damien', 'Lefebvre', NULL),
    ('emma.girard', 'emma@example.com', 'hash5', 'Emma', 'Girard', NULL),
    ('francois.dupont', 'francois@example.com', 'hash6', 'François', 'Dupont', NULL),
    ('julien.moreau', 'julien@example.com', 'hash7', 'Julien', 'Moreau', NULL),
    ('lea.caron', 'lea@example.com', 'hash8', 'Léa', 'Caron', NULL);

INSERT INTO conversations (name, type) VALUES
    ('Discussion Alice & Benjamin', 'private'),
    ('Voyage à Paris', 'group'),
    ('Projet Secret', 'group'),
    ('Discussion Julien & Léa', 'private');

INSERT INTO participants (user_id, conversation_id) VALUES
    (1,1), (2,1),
    (3,2), (4,2), (5,2),
    (1,3), (2,3), (3,3), (6,3),
    (7,4), (8,4);

INSERT INTO messages (content, author_id, conversation_id, status, read_at) VALUES
    ('Salut Benjamin, comment vas-tu ?', 1, 1, 'delivered', NULL),
    ('Ça va bien, merci ! Et toi ?', 2, 1, 'read', '2024-05-01 10:05:00'),
    ('Très bien, merci. Tu fais quoi ce soir ?', 1, 1, 'sent', NULL),
    ('Je vais au cinéma, tu veux venir ?', 2, 1, 'sent', NULL),
    ('Vous êtes prêts pour le voyage à Paris ?', 3, 2, 'sent', NULL),
    ('Oui, j''ai déjà préparé mes valises.', 4, 2, 'sent', NULL),
    ('Trop hâte de voir la Tour Eiffel !', 5, 2, 'delivered', NULL),
    ('On se retrouve à la gare à 8h ?', 3, 2, 'sent', NULL),
    ('Le plan pour le projet secret est prêt ?', 1, 3, 'delivered', NULL),
    ('Presque, il manque juste le budget.', 6, 3, 'sent', NULL),
    ('On en discute demain matin.', 2, 3, 'read', '2024-05-01 09:30:00'),
    ('Parfait, j''apporte les croissants.', 3, 3, 'sent', NULL),
    ('Salut Léa, tu viens au café cet après-midi ?', 7, 4, 'sent', NULL),
    ('Oui, à quelle heure ?', 8, 4, 'delivered', NULL),
    ('Vers 15h devant la bibliothèque.', 7, 4, 'read', '2024-05-01 12:00:00'),
    ('À tout à l''heure !', 8, 4, 'sent', NULL);

INSERT INTO notifications (user_id, conversation_id, message_id) VALUES
    (2,1,1),
    (2,1,3),
    (1,1,4),
    (4,2,5), (5,2,5),
    (3,2,6), (5,2,6),
    (3,2,7), (4,2,7),
    (4,2,8), (5,2,8),
    (2,3,9), (3,3,9), (6,3,9),
    (1,3,10), (2,3,10), (3,3,10),
    (1,3,12), (2,3,12), (6,3,12),
    (8,4,13),
    (7,4,14),
    (7,4,16);
