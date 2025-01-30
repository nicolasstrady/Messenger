"use client";
import React, {useEffect, useState} from "react";
import Link from "next/link";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import NotificationPopup from "@/app/components/NotificationPopup";

type Conversation = {
    name: string;
    id: number;
    other_user_names: string;
};

const Page = () => {
    const {userId} = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<number[]>([]); // Liste des conversations avec notification
    const [socket, setSocket] = useState<any>(null);

    // 🔄 Récupération des conversations
    useEffect(() => {
        if (!userId) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/conversations/${userId}`, {
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

        fetchConversations();
    }, [userId]);

    // 🔔 Récupération des notifications stockées en base
    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            try {
                const response = await fetch(`http://192.168.1.68:8000/notifications?userId=${userId}`);
                const data = await response.json();
                setNotifications(data.map((notif: { conversation_id: number }) => notif.conversation_id));
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

        socketInstance.on("new_notification", ({conversation_id}) => {
            setNotifications((prev) => [...new Set([...prev, conversation_id])]); // Évite les doublons
        });

        socketInstance.on("disconnect", () => console.log("Socket.IO disconnected"));

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [userId]);

    return (
        <div className="p-4">
            {/* Barre de navigation avec notifications */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Liste des Conversations</h1>
                <NotificationPopup/>
            </div>

            {/* Liste des conversations */}
            {conversations.length === 0 ? (
                <p>Pas de conversation</p>
            ) : (
                <ul className="space-y-4">
                    {conversations.map((conversation: Conversation) => (
                        <li key={conversation.id}>
                            <Link
                                href={{
                                    pathname: `/conversations/${conversation.id}`,
                                    query: {title: conversation.name ?? conversation.other_user_names},
                                }}
                                onClick={() => {
                                    // 🔔 Supprimer la notification lorsque l'on ouvre la conversation
                                    setNotifications((prev) => prev.filter((id) => id !== conversation.id));
                                }}
                            >
                                <div
                                    className="border-2 border-gray-600 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition duration-200 flex justify-between items-center"
                                >
                                    <h4 className="text-lg font-semibold">
                                        {conversation.name ?? conversation.other_user_names}
                                    </h4>
                                    {/* Affichage de l'icône 🔔 si la conversation a une notification */}
                                    {notifications.includes(conversation.id) && (
                                        <span className="text-red-500">🔔</span>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Page;
