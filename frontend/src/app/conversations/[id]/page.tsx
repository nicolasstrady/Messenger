"use client";
import React, {useEffect, useState, useRef} from "react";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter, useSearchParams} from "next/navigation";
import {Avatar, AvatarGroup} from "@mui/material";
import {stringAvatar} from "@/utils/AvatarUtils";

type Message = {
    id?: number;
    author_id: number | null;
    conversation_id: number;
    content: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    status?: "sent" | "delivered" | "read";
    read_at?: string;
    profile_image?: string;
};

export default function ConversationPage({params}: { params: Promise<{ id: number }> }) {
    const resolvedParams = React.use(params);
    const [messages, setMessages] = useState<Message[]>([]);
    const [lastReadMessage, setLastReadMessage] = useState<Message | null>(null);
    const [lastDistributedMessage, setLastDistributedMessage] = useState<Message | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [socket, setSocket] = useState<any>(null);
    const {userId, token, first_name, last_name, profile_image} = useUser();
    const [title, setTitle] = useState("");
    const [typingUsers, setTypingUsers] = useState<{ userId: number, name: string }[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true); // 🔄 État pour le skeleton
    const [profileImages, setProfileImages] = useState<{ url: string[], alt: string[] } | null>(null);


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
                setProfileImages(data.profile_image);
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
    }, [messages, typingUsers]);

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
            first_name: first_name,
            last_name: last_name,
            profile_image: profile_image ?? undefined
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
        const readMessage = [...messages]
            .reverse()
            .find((msg) => msg.author_id === userId && msg.read_at);

        setLastReadMessage(readMessage ?? null);

        const distributedMessage = [...messages]
            .reverse()
            .find((msg) => msg.author_id === userId && msg.status === "delivered");

        setLastDistributedMessage(distributedMessage ?? null);
    }, [messages]);

    useEffect(() => {
        document.title = "Messenger | " + title;
    }, [title]);

    return (
        <div className="flex flex-grow w-full justify-between flex-col py-3 gap-3 ">
            {/*🔔 Barre de navigation avec notifications */}
            <div className="flex gap-2 items-center">
                <AvatarGroup spacing="small" max={4} className="self-center">
                    {profileImages?.url?.map((url: string, index) => {
                        return (
                            <Avatar
                                key={index} src={url}
                                {...stringAvatar(profileImages.alt[index] ?? "")}>
                            </Avatar>
                        );
                    })}
                </AvatarGroup>
                <p className="lg:text-2xl text-lg truncate">{title}</p>
            </div>
            <div className={"flex flex-col flex-grow"}>
                <div
                    className="bg-white rounded-lg overflow-y-auto py-2 scrollbar-custom flex-grow h-0">
                    {/*    /!*h-[60vh] xl:h-[80vh]*!/*/}
                    {messages.map((message, index) => {
                        const isCurrentUser = message.author_id === userId;
                        const isLastRead = lastReadMessage?.id === message.id;
                        const isLastDistributed = lastDistributedMessage?.id === message.id;

                        const previousMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];
                        const isDifferentAuthor = !previousMessage || previousMessage.author_id !== message.author_id;
                        const isLastFromAuthor = !nextMessage || nextMessage.author_id !== message.author_id;

                        // URL de l'image de l'utilisateur depuis AWS S3 (exemple)

                        console.log(message);

                        return (
                            <div
                                key={message.id}
                                className={`relative flex flex-col ${isCurrentUser ? "items-end" : "items-start "}`}
                            >
                                {isDifferentAuthor && (
                                    <p className="text-xs text-center py-2 w-full">{new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}</p>
                                )}
                                <div
                                    className={`flex flex-grow w-full ${isCurrentUser ? "flex-row-reverse pl-12" : "flex-row pr-12"}`}>
                                    <div
                                        className=" w-[3rem] flex p-1 flex-shrink-0 justify-center items-center">
                                        {isLastFromAuthor && (
                                            <Avatar
                                                key={index} src={message.profile_image}
                                                {...stringAvatar(`${message.first_name} ${message.last_name}`)}>
                                            </Avatar>
                                        )}
                                    </div>
                                    {/* Conteneur du message avec le tooltip */}
                                    <div className={`group relative`}>
                                        <div
                                            className={`p-2 px-4 my-1 rounded-lg max-w-xl ${
                                                isCurrentUser ? "bg-blue-100" : "bg-gray-200"
                                            } break-words whitespace-normal`}
                                        >
                                            <p>{message.content}</p>
                                        </div>
                                        {isCurrentUser && (
                                            (message.status === "sent" || message.status === "delivered" || (isLastRead && message.read_at)) && (
                                                <span
                                                    className="text-xs text-gray-600 block mb-1 text-right">
                                                    {message.status === "sent" && "Envoyé"}
                                                    {isLastDistributed && message.status === "delivered" && "Distribué"}
                                                    {isLastRead && message.read_at ? `Lu à ${new Date(message.read_at).toLocaleTimeString()}` : ""}
                                                </span>
                                            )
                                        )}
                                        {/* Bulle affichant l'heure au survol */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                                            hidden group-hover:flex bg-gray-800 text-white text-xs px-2 py-1
                                            rounded-lg shadow-md">
                                            {new Date(message.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
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
            </div>

            <form
                className="flex"
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
