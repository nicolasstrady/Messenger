"use client";
import React, {useEffect, useLayoutEffect, useState} from "react";
import Link from "next/link";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import CreateConversation from "@/components/CreateConversation";
import {useRouter} from "next/navigation";

type Conversation = {
    name: string;
    id: number;
    last_message?: string;
    last_message_at?: string;
    last_message_author_first_name?: string;
    last_message_author_last_name?: string;
};

const Page = () => {
    const {userId, token, notifications, clearNotification} = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true); // 🔄 État pour le skeleton
    const router = useRouter();

    useEffect(() => {
        console.log(token);
        if (!token && !isLoading) {
            router.replace("/"); // Redirection si non connecté
        }
    }, [token, router]);

    // 🔄 Fonction pour rafraîchir les conversations après la création
    const refreshConversations = async () => {
        if (!userId) return;
        setIsLoading(true); // Active le loading
        try {
            console.log('FETCH CONVERSATIONS')
            const response = await fetch(`http://192.168.1.68:8000/conversations/user/${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
            });
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoading(false); // Désactive le loading après le fetch
        }
    };

    // 🔄 Chargement des conversations et des notifications
    useLayoutEffect(() => {
        console.log('USE LAYOUT EFFECT');
        refreshConversations();
    }, [userId]);

    // 🔔 Écoute des notifications en temps réel via Socket.IO
    useEffect(() => {
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO connected");
            socketInstance.emit("authenticate", {userId});
        });

        socketInstance.on("authenticated", ({socketId}) => console.log("Socket.IO conv list ", socketId));

        socketInstance.on("new_notification", (notif) => {
            console.log("🔔 Nouvelle notification :", notif);
            console.log("🔔 contenu :", notif.message.content);

            // Met à jour la conversation correspondante avec le dernier message reçu
            setConversations((prevConversations) => {
                return prevConversations.map((conv) =>
                    conv.id == notif.conversation_id
                        ? {
                            ...conv,
                            last_message: notif.message.content,
                            last_message_at: new Date().toISOString(), // Met à jour la date du dernier message
                            last_message_author_first_name: notif.message.first_name,
                            last_message_author_last_name: notif.message.last_name,
                        }
                        : conv
                );
            });

            // Déplace la conversation en haut de la liste
            setConversations((prevConversations) => {
                const updatedConversations = [...prevConversations];
                const updatedConvIndex = updatedConversations.findIndex((conv) => conv.id === notif.conversation_id);

                if (updatedConvIndex !== -1) {
                    const updatedConv = updatedConversations.splice(updatedConvIndex, 1)[0];
                    updatedConversations.unshift(updatedConv);
                }

                return updatedConversations;
            });
        });

        socketInstance.on("disconnect", () => console.log("Socket.IO disconnected"));

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [userId]);

    console.log(notifications, conversations);
    useEffect(() => {
        document.title = "Messenger | Conversations";
    }, []);

    return (
        <>
            {/*<title>Messenger | Conversations</title>*/}
            <div className="p-4 h-[95vh]">
                {/* 🔔 Barre de navigation avec notifications */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl">Conversations</h1>
                    <div className="flex gap-4">
                        <CreateConversation onConversationCreated={refreshConversations}/>
                    </div>
                </div>
                {/* 🎭 Skeleton Loader pendant le chargement */}
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
                            <div key={index}
                                 className="animate-pulse bg-white rounded-lg p-4 flex justify-between items-start">
                                <div className="flex flex-col space-y-2">
                                    <div className="w-48 h-5 bg-gray-300 rounded"></div>
                                    <div className="w-32 h-3 bg-gray-300 rounded"></div>
                                </div>
                                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Liste des conversations */
                    conversations.length === 0 ? (
                        <p>Pas de conversation</p>
                    ) : (
                        <ul className="space-y-2">
                            {conversations.map((conversation: Conversation) => {
                                const unreadMessagesCount = notifications.filter((notif) => notif.conversation_id === conversation.id).length;

                                return (
                                    <li key={conversation.id}>
                                        <Link
                                            href={{
                                                pathname: `/conversations/${conversation.id}`,
                                            }}
                                            onClick={() => clearNotification(conversation.id)}
                                        >
                                            <div
                                                className="rounded-lg p-3 hover:bg-gray-100 bg-white cursor-pointer transition duration-200 flex justify-between items-start"
                                            >
                                                <div className="flex flex-col">
                                                    <h4 className="text-lg font-semibold">{conversation.name}</h4>
                                                    {conversation.last_message && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span>{conversation.last_message_author_first_name} :</span> {conversation.last_message}
                                                        </p>
                                                    )}
                                                </div>
                                                {/* 🔴 Affichage du compteur de messages non lus */}
                                                {unreadMessagesCount > 0 && (
                                                    <div
                                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                                                    >
                                                        {unreadMessagesCount}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}
            </div>
        </>
    );
};

export default Page;
