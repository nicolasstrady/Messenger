"use client";

import React, {useCallback, useEffect, useLayoutEffect, useState} from "react";
import Link from "next/link";
import io from "socket.io-client";
import {useUser} from "@/app/UserContext";
import type {Notification} from "@/app/UserContext";
import CreateConversation from "@/components/CreateConversation";
import {useRouter} from "next/navigation";
import {Avatar, AvatarGroup} from "@mui/material";
import {stringAvatar} from "@/utils/AvatarUtils";
import {Inbox, MessageSquareText, Search} from "lucide-react";

type Conversation = {
    name: string;
    id: number;
    last_message?: string;
    last_message_at?: string;
    last_message_author_first_name?: string;
    last_message_author_last_name?: string;
    profile_image?: { url: string[], alt: string[] };
};

const Page = () => {
    const {userId, token, notifications, clearNotification} = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!token && !isLoading) {
            router.replace("/");
        }
    }, [token, router, isLoading]);

    const refreshConversations = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useLayoutEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    useEffect(() => {
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            socketInstance.emit("authenticate", {userId});
        });

        socketInstance.on("authenticated", ({socketId}) => console.log("Socket.IO conv list ", socketId));

        socketInstance.on("new_notification", (notif: Notification) => {
            setConversations((prevConversations) => {
                const updated = prevConversations.map((conv) =>
                    conv.id == notif.conversation_id
                        ? {
                            ...conv,
                            last_message: notif.message.content,
                            last_message_at: new Date().toISOString(),
                            last_message_author_first_name: notif.message.first_name,
                            last_message_author_last_name: notif.message.last_name,
                        }
                        : conv
                );
                const updatedConvIndex = updated.findIndex((conv) => conv.id === notif.conversation_id);

                if (updatedConvIndex !== -1) {
                    const updatedConv = updated.splice(updatedConvIndex, 1)[0];
                    updated.unshift(updatedConv);
                }

                return updated;
            });
        });

        socketInstance.on("disconnect", () => console.log("Socket.IO disconnected"));
        return () => {
            socketInstance.disconnect();
        };
    }, [userId]);

    useEffect(() => {
        document.title = "Messenger | Conversations";
    }, []);

    const filteredConversations = conversations.filter((conversation) =>
        conversation.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-sky-200/80 bg-[#f9fcff]/96 shadow-2xl shadow-sky-950/15 backdrop-blur-2xl dark:border-[#1b263a] dark:bg-[#0b1426]/96 dark:shadow-black/40">
            <header className="border-b border-sky-200/80 bg-[#edf6ff] px-4 py-4 backdrop-blur-xl sm:px-6 dark:border-[#1b263a] dark:bg-[#111c31]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-cyan-300">Messages</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Conversations</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative min-w-0 flex-1 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher"
                                className="h-10 w-full rounded-lg border border-sky-200 bg-white/92 pl-10 pr-3 text-sm text-slate-900 shadow-sm shadow-sky-950/5 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-white/10 dark:bg-[#20283a] dark:text-white dark:placeholder:text-slate-400 dark:focus:border-cyan-400/50 dark:focus:ring-cyan-400/10"
                            />
                        </div>
                        <CreateConversation onConversationCreated={refreshConversations}/>
                    </div>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#e3f0ff] p-3 scrollbar-custom sm:p-4 dark:bg-[#07101f]">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                            <div key={index} className="animate-pulse rounded-lg border border-sky-200/80 bg-white/82 p-4 dark:border-white/10 dark:bg-[#151c2a]">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-white/10"/>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="h-4 w-52 rounded bg-blue-100 dark:bg-white/10"/>
                                        <div className="h-3 w-72 max-w-full rounded bg-blue-50 dark:bg-white/5"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-sky-200/80 bg-white/82 px-4 text-center backdrop-blur-xl dark:border-white/10 dark:bg-[#151c2a]">
                        <Inbox className="text-sky-500 dark:text-cyan-300/70" size={38}/>
                        <p className="mt-3 font-semibold text-slate-800 dark:text-white">Aucune conversation</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">Creez une discussion pour commencer.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {filteredConversations.map((conversation: Conversation) => {
                            const unreadMessagesCount = notifications.filter((notif) => notif.conversation_id === conversation.id).length;

                            return (
                                <li key={conversation.id}>
                                    <Link
                                        href={{pathname: `/conversations/${conversation.id}`}}
                                        onClick={() => clearNotification(conversation.id)}
                                        className="group block rounded-lg border border-sky-200/80 bg-white p-3 shadow-md shadow-sky-950/8 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-400/70 hover:bg-white hover:shadow-lg hover:shadow-sky-950/15 dark:border-white/10 dark:bg-[#151c2a] dark:shadow-black/25 dark:hover:border-cyan-400/45 dark:hover:bg-[#1b2435]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <AvatarGroup spacing={24} max={3} className="shrink-0">
                                                {conversation.profile_image?.url?.map((url: string, index) => (
                                                    <Avatar
                                                        key={index}
                                                        src={url}
                                                        {...stringAvatar(conversation.profile_image?.alt[index] ?? "")}
                                                    />
                                                ))}
                                            </AvatarGroup>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="truncate text-base font-semibold text-slate-950 dark:text-white">{conversation.name}</h4>
                                                    {unreadMessagesCount > 0 && (
                                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                                                            {unreadMessagesCount}
                                                        </span>
                                                    )}
                                                </div>
                                                {conversation.last_message ? (
                                                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-blue-100/[0.65]">
                                                        <span className="font-medium text-slate-700 dark:text-blue-100">{conversation.last_message_author_first_name} :</span> {conversation.last_message}
                                                    </p>
                                                ) : (
                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400 dark:text-blue-200/[0.45]">
                                                        <MessageSquareText size={15}/>
                                                        Aucun message
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Page;
