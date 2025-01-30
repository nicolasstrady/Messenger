"use client";

import React, {useEffect, useState, useRef} from "react";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter, useSearchParams} from "next/navigation";
import {router} from "next/client";

type Message = {
    id?: number;
    author_id: number | null;
    conversation_id: number;
    content: string;
    created_at: string;
    first_name?: string;
    last_name?: string;
    status?: "sent" | "delivered" | "read";
    read_at?: string;
};

export default function ConversationPage({params}: { params: Promise<{ id: number }> }) {
    const resolvedParams = React.use(params);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [socket, setSocket] = useState<any>(null);
    const {userId, token, first_name, last_name} = useUser();
    const searchParams = useSearchParams();
    const title = searchParams.get("title");
    const [typingUsers, setTypingUsers] = useState<{ userId: number, name: string }[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    // 🔔 Gestion des notifications
    const [notifications, setNotifications] = useState<{ conversation_id: number; message: Message }[]>([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    useEffect(() => {
        if (!resolvedParams.id) return;

        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO connected");
            socketInstance.emit("authenticate", {userId, conversationId: resolvedParams.id});
        });

        socketInstance.on("authenticated", () => console.log("Socket.IO authenticated"));

        socketInstance.on("message", (message: Message) => {
            console.log("Received message", message);
            setMessages((prev) => [...prev, message]);
        });

        socketInstance.on("message_status", ({id, status}) => {
            console.log("Received message_status", id, status);
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === id ? {...msg, status} : msg
                )
            );
        });

        socketInstance.on("user_typing", ({userId: typingUserId, firstName, lastName}) => {
            if (typingUserId !== userId) { // Vérifie si c'est un autre utilisateur
                setTypingUsers((prev) => {
                    if (!prev.some(user => user.userId === typingUserId)) {
                        return [...prev, {userId: typingUserId, name: `${firstName} ${lastName}`}];
                    }
                    return prev;
                });
            }
        });

        socketInstance.on("user_stopped_typing", ({userId: stoppedUserId}) => {
            if (stoppedUserId !== userId) { // Vérifie si c'est un autre utilisateur
                setTypingUsers((prev) => prev.filter(user => user.userId !== stoppedUserId));
            }
        });

        // 🔔 Écoute des notifications en temps réel
        socketInstance.on("new_notification", ({conversation_id, message}) => {
            if (conversation_id !== resolvedParams.id) {
                setNotifications((prev) => [...prev, {conversation_id, message}]);
            }
        });

        socketInstance.on("connect_error", (error: any) => console.error("Socket.IO connection error", error));
        socketInstance.on("disconnect", () => console.log("Socket.IO disconnected"));

        setSocket(socketInstance);

        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/messages/${resolvedParams.id}`);
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchMessages();

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [resolvedParams.id]);


    // 🔔 Suppression des notifications quand l'utilisateur ouvre la conversation
    useEffect(() => {
        if (notifications.length > 0) {
            setNotifications((prev) => prev.filter(notif => notif.conversation_id !== resolvedParams.id));
        }
    }, [resolvedParams.id]);

    useEffect(() => {
        if (messages.length > 0) {
            messages.forEach((msg) => {
                // Vérifie si le message est livré mais pas encore lu et si l'utilisateur n'est pas l'auteur du message
                if (msg.status === "delivered" && msg.author_id !== userId) {
                    socket?.emit("mark_as_read", {
                        messageId: msg.id,
                        conversationId: resolvedParams.id,
                        readerId: userId
                    });
                }
            });
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket) return;

        const existingIds = messages.map((msg) => Number(msg.id)).filter((id) => !isNaN(id));
        const tempId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

        const message: Message = {
            id: tempId,
            content: newMessage,
            conversation_id: resolvedParams.id,
            author_id: userId,
            created_at: new Date().toISOString(),
            status: "sent",
        };
        console.log("Sending message", message);
        socket.emit("message", message);
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit("typing", {
                conversationId: resolvedParams.id,
                userId,
                firstName: first_name,
                lastName: last_name
            });

            // Réinitialiser le timeout s'il existe déjà
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Démarrer un nouveau timeout pour arrêter de taper après 2 secondes d'inactivité
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop_typing", {conversationId: resolvedParams.id, userId});
                typingTimeoutRef.current = null; // Réinitialisation
            }, 2000);
        }
    };


    console.log(notifications);

    return (
        <div className="p-4">
            {/* 🔔 Barre de navigation avec notifications */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{title ? `${title}` : `Conversation ${resolvedParams.id}`}</h1>
                <div className="relative">
                    <button onClick={() => setIsNotificationModalOpen(true)}>
                        🔔
                        {notifications.length > 0 && (
                            <span
                                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="border rounded-lg p-4 h-[80vh] overflow-y-auto flex flex-col">
                {messages.map((message) => {
                    const isCurrentUser = message.author_id === userId;
                    return (
                        <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`p-2 my-2 rounded-lg max-w-xs ${
                                    isCurrentUser ? "bg-blue-100 text-justify" : "bg-gray-200 text-justify"
                                } break-words whitespace-pre-wrap`}
                            >
                                <p className="text-sm font-semibold">
                                    {isCurrentUser ? "Vous" : `${message.first_name} ${message.last_name}`}
                                </p>
                                <p>{message.content}</p>
                                <span className="text-xs text-gray-500 block mt-1">
                                    {new Date(message.created_at).toLocaleTimeString()} &nbsp;
                                    {message.status === "sent" && "Envoyé"}
                                    {message.status === "delivered" && "Reçu"}
                                    {message.status === "read" && "Lu"}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef}/>
            </div>
            {typingUsers.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                    {typingUsers.map(user => user.name).join(", ")} {typingUsers.length > 1 ? "sont" : "est"} en train
                    d'écrire...
                </p>
            )}

            <form
                className="mt-4 flex"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }}
            >
                <input
                    type="text"
                    className="flex-grow border rounded-l-lg p-2"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder="Tapez votre message..."
                />
                <button type="submit" className="bg-blue-500 text-white px-4 rounded-r-lg">Envoyer</button>
            </form>
            {isNotificationModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                        <button
                            onClick={() => setIsNotificationModalOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                        >
                            ✖
                        </button>
                        <h2 className="text-lg font-bold mb-4">📩 Notifications</h2>

                        {notifications.length === 0 ? (
                            <p className="text-gray-500">Aucune nouvelle notification</p>
                        ) : (
                            <ul className="space-y-3">
                                {notifications.map((notif, index) => (
                                    <li key={index} className="p-2 border-b border-gray-200">
                                        <p className="text-sm font-semibold">{notif.message.first_name} {notif.message.last_name}</p>
                                        <p className="text-sm text-gray-700">{notif.message.content}</p>
                                        <button
                                            onClick={() => {
                                                router.push(`/conversations/${notif.message.conversation_id}`);
                                                setIsNotificationModalOpen(false);
                                            }}
                                            className="text-blue-500 text-xs mt-1 hover:underline"
                                        >
                                            Voir la conversation
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>

    );
}
