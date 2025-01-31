"use client";
import React, {useEffect, useState} from "react";
import Link from "next/link";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import NotificationPopup, {Notification} from "@/app/components/NotificationPopup";
import CreateConversation from "@/app/components/CreateConversation";

type Conversation = {
    name: string;
    id: number;
    last_message?: string;
    last_message_at?: string;
    last_message_author_first_name?: string;
    last_message_author_last_name?: string;
};

const Page = () => {
    const {userId} = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]); // 🔔 Liste complète des notifications
    const [socket, setSocket] = useState<any>(null);

    // 🔄 Fonction pour rafraîchir les conversations après la création
    const refreshConversations = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://192.168.1.68:8000/conversations/user/${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
            });
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        }
    };

    // 🔄 Chargement des conversations et des notifications
    useEffect(() => {
        refreshConversations();
    }, [userId]);

    // 🔔 Récupération des notifications stockées en base
    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/notifications?userId=${userId}`);
                const data = await response.json();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
    }, [userId]);

    // 🔔 Écoute des notifications en temps réel via Socket.IO
    useEffect(() => {
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO connected");
            socketInstance.emit("authenticate", {userId});
        });

        socketInstance.on("new_notification", (notif) => {
            console.log("🔔 Nouvelle notification :", notif);
            console.log("🔔 contenu :", notif.message.content);

            // Ajoute la notification
            setNotifications((prev) => [...prev, notif]);

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

    return (
        <div className="p-4">
            {/* 🔔 Barre de navigation avec notifications */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Liste des Conversations</h1>
                <div className="flex gap-4">
                    <CreateConversation onConversationCreated={refreshConversations}/>
                    <NotificationPopup notifications={notifications} setNotifications={setNotifications}/>
                </div>
            </div>

            {/* Liste des conversations */}
            {conversations.length === 0 ? (
                <p>Pas de conversation</p>
            ) : (
                <ul className="space-y-4">
                    {conversations.map((conversation: Conversation) => {
                        const unreadMessagesCount = notifications.filter((notif) => notif.conversation_id === conversation.id).length;

                        return (
                            <li key={conversation.id}>
                                <Link
                                    href={{
                                        pathname: `/conversations/${conversation.id}`,
                                    }}
                                    onClick={() => {
                                        // 🔔 Supprimer la notification lorsque l'on ouvre la conversation
                                        setNotifications((prev) => prev.filter((notif) => notif.conversation_id !== conversation.id));
                                    }}
                                >
                                    <div
                                        className="border-2 border-gray-600 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition duration-200 flex justify-between items-start"
                                    >
                                        <div className="flex flex-col">
                                            <h4 className="text-lg font-semibold">{conversation.name}</h4>
                                            {conversation.last_message && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <span
                                                        className="font-semibold">{conversation.last_message_author_first_name} {conversation.last_message_author_last_name} :</span> {conversation.last_message}
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
            )}
        </div>
    );
};

export default Page;
