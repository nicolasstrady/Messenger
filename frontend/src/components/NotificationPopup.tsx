"use client";

import React from "react";
import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";
import {Bell, X} from "lucide-react";

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
            <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100/80 bg-white/75 text-slate-700 shadow-sm shadow-blue-950/5 backdrop-blur-xl transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:shadow-black/20 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/10 dark:hover:text-white"
                aria-label="Notifications"
            >
                <Bell size={19}/>
                {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-md rounded-lg border border-blue-100/80 bg-white/90 p-5 shadow-2xl shadow-blue-950/[0.15] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/[0.35]">
                        <button
                            onClick={() => setIsNotificationModalOpen(false)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-slate-900 dark:text-blue-200 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="Fermer"
                        >
                            <X size={18}/>
                        </button>

                        <div className="mb-4 pr-8">
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Notifications</h2>
                            <p className="text-sm text-slate-500 dark:text-blue-200/70">Messages recus pendant votre navigation.</p>
                        </div>

                        {notifications.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-blue-100 bg-blue-50/60 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/70">
                                Aucune nouvelle notification
                            </p>
                        ) : (
                            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-custom">
                                {notifications.map((notif, index) => (
                                    <li key={index} className="rounded-lg border border-blue-100 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{notif.message.first_name} {notif.message.last_name}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-blue-100/75">{notif.message.content}</p>
                                        <button
                                            onClick={() => {
                                                router.push(`/conversations/${notif.conversation_id}`);
                                                setIsNotificationModalOpen(false);
                                                clearNotification(notif.conversation_id);
                                            }}
                                            className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
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
