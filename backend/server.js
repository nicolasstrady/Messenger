const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io');
const mysql = require('mysql2/promise');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: 'http://192.168.1.68:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    }
});

// Création du pool de connexion MySQL
const pool = mysql.createPool({
    host: 'database',
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
                connectedUsers.set(userId, {socketId: socket.id, conversationId});
                console.log(connectedUsers);
                socket.join(conversationId);
                socket.emit('authenticated', {success: true});

                // Envoyer les notifications en attente
                const [notifications] = await pool.query("SELECT * FROM notifications no INNER JOIN messages mes ON mes.id = no.conversation_id INNER JOIN users us ON us.id = mes.author_id WHERE user_id = ?", [userId]);
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
                await pool.query("DELETE FROM notifications WHERE user_id = ?", [userId]);
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

        const {content, conversation_id} = data;
        if (!content || !conversation_id) {
            socket.emit('error', {message: 'Missing content or conversationId'});
            return;
        }

        try {
            const [result] = await pool.query(
                "INSERT INTO messages (content, author_id, conversation_id, status) VALUES (?, ?, ?, 'sent')",
                [content, socket.userId, conversation_id]
            );

            const messageId = result.insertId;

            const message = {
                id: messageId,
                content,
                author_id: socket.userId,
                conversation_id,
                created_at: new Date().toISOString(),
                status: 'sent',
                first_name: socket.firstName,
                last_name: socket.lastName,
            };

            socket.to(conversation_id).emit('message', message);

            // Vérifier les utilisateurs connectés
            const [participants] = await pool.query(
                "SELECT user_id FROM participants WHERE conversation_id = ? AND user_id != ?",
                [conversation_id, socket.userId]
            );


            for (const participant of participants) {
                const user = connectedUsers.get(participant.user_id);
                if (!user || user.conversationId !== conversation_id) {
                    // Stocker la notification en base de données
                    await pool.query(
                        "INSERT INTO notifications (user_id, conversation_id, message_id, created_at) VALUES (?, ?, ?, NOW())",
                        [participant.user_id, conversation_id, messageId]
                    );
                    console.log(conversation_id, typeof conversation_id);

                    if (user) {// Envoyer la notification en temps réel si connecté mais sur une autre conversation
                        io.to(user.socketId).emit('new_notification', {
                            conversation_id: parseInt(conversation_id, 10),
                            message,
                        });
                    }
                }
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
        console.log('Marqué comme lu', messageId, conversationId, readerId);
        try {
            const [rows] = await pool.query("SELECT author_id FROM messages WHERE id = ?", [messageId]);
            if (rows.length > 0 && rows[0].author_id !== readerId) {
                await pool.query("UPDATE messages SET status = 'read', read_at = NOW() WHERE id = ?", [messageId]);
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
            if (value.socketId === socket.id) {
                connectedUsers.delete(key);
            }
        });
        console.log('User disconnected');
    });
});

httpServer.listen(8081, () => {
    console.log('Server is running on ws://0.0.0.0:8081');
});
