"use client";
import React, {useEffect, useState, useRef} from "react";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter, useSearchParams} from "next/navigation";

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
    const [lastReadMessage, setLastReadMessage] = useState<Message | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [socket, setSocket] = useState<any>(null);
    const {userId, token, first_name, last_name} = useUser();
    const [title, setTitle] = useState("");
    const [typingUsers, setTypingUsers] = useState<{ userId: number, name: string }[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true); // 🔄 État pour le skeleton


    useEffect(() => {
        console.log(token);
        if (!token && !isLoading) {
            router.replace("/"); // Redirection si non connecté
        }
    }, [token, router]);

    useEffect(() => {
        if (!resolvedParams.id) return;
        if (!userId) return;
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO connected");
            socketInstance.emit("authenticate", {userId, conversationId: resolvedParams.id});
        });

        socketInstance.on("authenticated", ({socketId}) => console.log("Socket.IO conv Id ", socketId));

        socketInstance.on("message", (message: Message) => {
            console.log("Received message", message);
            setMessages((prev) => [...prev, message]);
        });

        socketInstance.on("message_status", ({id, status, read_at}) => {
            console.log("Received message_status", id, status, read_at);
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === id ? {...msg, status, read_at} : msg
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

        // // 🔔 Écoute des notifications en temps réel
        // socketInstance.on("new_notification", ({conversation_id, message}) => {
        //     if (conversation_id !== resolvedParams.id) {
        //         setNotifications((prev) => [...prev, {conversation_id, message}]);
        //     }
        // });

        socketInstance.on("connect_error", (error: any) => console.error("Socket.IO connection error", error));
        socketInstance.on("disconnect", () => console.log("Socket.IO disconnected"));

        setSocket(socketInstance);

        const fetchConversationDetails = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/conversations/${resolvedParams.id}/user/${userId}`);
                const data = await response.json();
                setTitle(data.name);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/messages/${resolvedParams.id}`);
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchConversationDetails();
        fetchMessages();
        setIsLoading(false);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [resolvedParams.id, userId]);

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
    console.log(messages);

    useEffect(() => {
        const message = [...messages]
            .reverse()
            .find((msg) => msg.author_id === userId && msg.read_at);

        setLastReadMessage(message ?? null);
    }, [messages]);

    useEffect(() => {
        document.title = "Messenger | " + title;
    }, [title]);

    return (
        <div className="p-4">
            {/* 🔔 Barre de navigation avec notifications */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl">{title}</h1>
            </div>

            <div className="bg-white rounded-lg p-4 h-[80vh] overflow-y-auto flex flex-col">
                {messages.map((message, index) => {
                    const isCurrentUser = message.author_id === userId;
                    const isLastRead = lastReadMessage?.id === message.id;
                    const previousMessage = messages[index - 1];
                    const isDifferentAuthor = !previousMessage || previousMessage.author_id !== message.author_id;

                    return (
                        <div key={message.id}
                            // className={`flex ${isCurrentUser ? "justify-end self-end" : "justify-start"}`}
                             className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                        >
                            {/*<div>*/}
                            {isDifferentAuthor && (

                                <div className="flex flex-row items-center gap-1 mt-4 mb-1">
                                    <p
                                        className="text-sm font-semibold">
                                        {isCurrentUser ? "Vous" : `${message.first_name}`}
                                    </p>
                                    <p className="text-xs">{new Date(message.created_at).toLocaleDateString()}</p>
                                </div>
                            )}
                            <div className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                                <p className={`text-xs text-gray-500 self-center`}>{new Date(message.created_at).toLocaleTimeString()}</p>

                                <div
                                    className={`p-2 px-4 my-1 rounded-lg max-w-lg ${
                                        isCurrentUser ? "bg-blue-100 text-right" : "bg-gray-200 text-left"
                                    } break-words whitespace-pre-wrap`}
                                >
                                    <p>{message.content}</p>
                                    {isCurrentUser && (
                                        (message.status === "sent" || message.status === "delivered" || (isLastRead && message.read_at)) && (
                                            <span className="text-xs text-blue-900 font-semibold block mb-1">
                                        {message.status === "sent" && "Envoyé"}
                                                {message.status === "delivered" && "Distribué"}
                                                {isLastRead && message.read_at ? `Lu à ${new Date(message.read_at).toLocaleTimeString()}` : ""}
                                     </span>
                                        )
                                    )}
                                </div>
                            </div>
                            {/*</div>*/}
                        </div>
                    );
                })}
                {typingUsers.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        {typingUsers.map(user => user.name).join(", ")} {typingUsers.length > 1 ? "sont" : "est"} en
                        train
                        d'écrire...
                    </p>
                )}
                <div ref={messagesEndRef}/>
            </div>

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
        </div>
    );
}
