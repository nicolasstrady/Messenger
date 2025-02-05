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


const NotificationPopup: React.FC = () => {
    const {notifications, clearNotification} = useUser();
    const router = useRouter();
    const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);

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
                                                clearNotification(notif.conversation_id);
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
