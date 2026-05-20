const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io');
const mysql = require('mysql2/promise');

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    }
});

// Création du pool de connexion MySQL
const pool = mysql.createPool({
    host: 'db_messenger',
    user: 'chat_user',
    password: 'chat_password',
    database: 'chat_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectedUsers = new Map(); // userId -> { socketId, conversationId }

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log('A user connected');

    // Authentification de l'utilisateur
    socket.on('authenticate', async (data) => {
        const {userId, conversationId} = data;
        try {
            const [rows] = await pool.query('SELECT id, first_name, last_name FROM users WHERE id = ?', [userId]);
            if (rows.length > 0) {
                socket.userId = userId;
                socket.firstName = rows[0].first_name;
                socket.lastName = rows[0].last_name;

                // Si l'utilisateur est déjà connecté, on ajoute un autre socketId à la liste
                if (connectedUsers.has(userId)) {
                    connectedUsers.get(userId).push({socketId: socket.id, conversationId});
                } else {
                    // Sinon, on crée une nouvelle entrée avec un tableau
                    connectedUsers.set(userId, [{socketId: socket.id, conversationId}]);
                }

                socket.join(conversationId);
                socket.emit('authenticated', {success: true, socketId: socket.id});

                // Envoyer les notifications en attente
                const [notifications] = await pool.query("SELECT * FROM notifications no INNER JOIN messages mes ON mes.id = no.message_id INNER JOIN users us ON us.id = mes.author_id WHERE mes.status != 'read' AND user_id = ?", [userId]);
                notifications.forEach((notif) => {
                    socket.emit('new_notification', {
                        conversation_id: notif.conversation_id,
                        message: {
                            id: notif.id,
                            content: notif.content,
                            author_id: notif.author_id,
                            conversation_id: notif.conversation_id,
                            created_at: notif.created_at,
                            status: notif.status,
                            first_name: notif.first_name,
                            last_name: notif.last_name,
                        }
                    });
                });

                // Supprimer les notifications une fois envoyées
                await pool.query("DELETE nf FROM notifications nf INNER JOIN messages mes ON mes.id = nf.message_id WHERE mes.`status` = 'read' AND nf.user_id = ?", [userId]);
            } else {
                socket.emit('authenticated', {success: false, message: 'User not found'});
            }
        } catch (err) {
            console.error(err);
            socket.emit('authenticated', {success: false, message: 'Authentication failed'});
        }
    });

    // Envoi d'un message
    socket.on('message', async (data) => {
        if (!socket.userId) {
            socket.emit('error', {message: 'You must authenticate first'});
            return;
        }

        const {content, conversation_id, profile_image} = data;
        if (!content || !conversation_id) {
            socket.emit('error', {message: 'Missing content or conversationId'});
            return;
        }

        try {
            const [result] = await pool.query(
                "INSERT INTO messages (content, author_id, conversation_id, status, created_at) VALUES (?, ?, ?, 'sent', CONVERT_TZ(NOW(), '+00:00', 'Europe/Paris'))",
                [content, socket.userId, conversation_id]
            );

            const messageId = result.insertId;

            console.log(socket.firstName, socket.lastName);

            const message = {
                id: messageId,
                content,
                author_id: socket.userId,
                conversation_id,
                created_at: new Date().toISOString(),
                status: 'sent',
                first_name: socket.firstName,
                last_name: socket.lastName,
                profile_image: profile_image,
            };

            socket.to(conversation_id).emit('message', message);

            // console.log(connectedUsers);

            // Vérifier les utilisateurs connectés
            const [participants] = await pool.query(
                "SELECT user_id FROM participants WHERE conversation_id = ? AND user_id != ?",
                [conversation_id, socket.userId]
            );

            for (const participant of participants) {
                const usersSockets = connectedUsers.get(participant.user_id);

                if (usersSockets) {
                    // Vérifier si au moins un socket du participant est déjà connecté à la conversation
                    const isConnectedToConversation = usersSockets.some(userSocket => userSocket.conversationId === conversation_id);

                    if (!isConnectedToConversation) {
                        // Si aucun socket de l'utilisateur n'est sur la conversation, on envoie la notification
                        usersSockets.forEach((userSocket) => {
                            io.to(userSocket.socketId).emit('new_notification', {
                                conversation_id: parseInt(conversation_id, 10),
                                message,
                            });
                        });
                    }
                }
                // Si l'utilisateur n'est pas connecté du tout, stocker la notification en base
                await pool.query(
                    "INSERT INTO notifications (user_id, conversation_id, message_id, created_at) VALUES (?, ?, ?, CONVERT_TZ(NOW(), '+00:00', 'Europe/Paris'))",
                    [participant.user_id, conversation_id, messageId]
                );
            }

            // Mise à jour du statut en 'delivered' après 1 seconde
            setTimeout(async () => {
                await pool.query("UPDATE messages SET status = 'delivered' WHERE id = ?", [messageId]);
                io.to(conversation_id).emit('message_status', {id: messageId, status: 'delivered'});
            }, 1000);
        } catch (err) {
            console.error(err);
            socket.emit('error', {message: 'Failed to send message'});
        }
    });

    // Marquer les messages comme lus uniquement quand un autre utilisateur les voit
    socket.on('mark_as_read', async ({messageId, conversationId, readerId}) => {
        try {
            const [rows] = await pool.query("SELECT author_id FROM messages WHERE id = ?", [messageId]);
            if (rows.length > 0 && rows[0].author_id !== readerId) {
                await pool.query("UPDATE messages SET status = 'read', read_at = CONVERT_TZ(NOW(), '+00:00', 'Europe/Paris') WHERE id = ?", [messageId]);
                io.to(conversationId).emit('message_status', {
                    id: messageId,
                    status: 'read',
                    read_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Gestion de l'événement "typing" pour informer les autres participants
    socket.on("typing", ({conversationId, userId, firstName, lastName}) => {
        socket.broadcast.to(conversationId).emit("user_typing", {userId, firstName, lastName});
    });

    // Gestion de l'événement "stop_typing" pour signaler que l'utilisateur a arrêté d'écrire
    socket.on("stop_typing", ({conversationId, userId}) => {
        socket.broadcast.to(conversationId).emit("user_stopped_typing", {userId});
    });

    // Déconnexion de l'utilisateur
    socket.on('disconnect', () => {
        connectedUsers.forEach((value, key) => {
            const index = value.findIndex((entry) => entry.socketId === socket.id);
            if (index !== -1) {
                value.splice(index, 1);
                if (value.length === 0) {
                    connectedUsers.delete(key);
                }
            }
        });
        console.log('User disconnected');
    });
});

httpServer.listen(8081, () => {
    console.log('Server is running on ws://0.0.0.0:8081');
});
