"use client";
import React, {useState, useEffect} from "react";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";

type Notification = {
    conversation_id: number;
    message: {
        id: number;
        first_name: string;
        last_name: string;
        content: string;
    };
};

const NotificationPopup = () => {
    const {userId} = useUser();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [socket, setSocket] = useState<any>(null);

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

    // 🔔 Écoute des notifications en temps réel via Socket.IO
    useEffect(() => {
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            console.log("Socket.IO connected");
            socketInstance.emit("authenticate", {userId});
        });

        socketInstance.on("new_notification", ({conversation_id, message}) => {
            setNotifications((prev) => [...prev, {conversation_id, message}]);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket.IO disconnected");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [userId]);


    return (
        <div className="relative">
            {/* Bouton de notification */}
            <button onClick={() => setIsNotificationModalOpen(true)} className="relative">
                🔔
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
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
