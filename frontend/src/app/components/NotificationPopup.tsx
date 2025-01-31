"use client";
import React, {useEffect, useState} from "react";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";

type Message = {
    id: number;
    first_name: string;
    last_name: string;
    content: string;
};

export type Notification = {
    conversation_id: number;
    message: Message;
};

type NotificationPopupProps = {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    conversationId?: number;
};

const NotificationPopup: React.FC<NotificationPopupProps> = ({notifications, setNotifications, conversationId}) => {
    const {userId} = useUser();
    const router = useRouter();
    const [socket, setSocket] = useState<any>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);

    // useEffect(() => {
    //     const savedNotifications = localStorage.getItem("notifications");
    //     if (savedNotifications) {
    //         setNotifications(JSON.parse(savedNotifications));
    //     }
    // }, []);

    // 🔔 Récupération des notifications stockées en base à la connexion
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

    // useEffect(() => {
    //     localStorage.setItem("notifications", JSON.stringify(notifications));
    // }, [notifications]);

    // 🔔 Écoute des notifications en temps réel via Socket.IO
    useEffect(() => {
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO notif");
            socketInstance.emit("authenticate", {userId});
        });

        // socketInstance.on("new_notification", (notification: Notification) => {
        //     console.log("New notification", notification);
        //     console.log(conversationId)
        //     if (notification.conversation_id !== conversationId) {
        //         setNotifications((prev) => [...prev, notification]); // Ajoute la nouvelle notification
        //     }
        // });

        socketInstance.on("disconnect", () => {
            console.log("Socket.IO disconnected");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [userId, setNotifications]);

    // console.log("Notifs", notifications);

    return (
        <div className="relative">
            {/* Bouton de notification */}
            <button onClick={() => setIsNotificationModalOpen(true)} className="relative text-2xl">
                🔔
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-3 rounded-full">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Modal de notifications */}
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
                                                router.push(`/conversations/${notif.conversation_id}`);
                                                setIsNotificationModalOpen(false);
                                                // Supprimer la notification après navigation
                                                setNotifications(prev => prev.filter(n => n.conversation_id !== notif.conversation_id));
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
};

export default NotificationPopup;
