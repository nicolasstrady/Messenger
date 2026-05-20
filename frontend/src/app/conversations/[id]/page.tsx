"use client";

import React, {useEffect, useState, useRef} from "react";
import Link from "next/link";
import io from "socket.io-client";
import type {Socket} from "socket.io-client";
import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";
import {Avatar, AvatarGroup} from "@mui/material";
import {stringAvatar} from "@/utils/AvatarUtils";
import {ArrowLeft, SendHorizonal} from "lucide-react";

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
    const [socket, setSocket] = useState<Socket | null>(null);
    const {userId, token, first_name, last_name, profile_image} = useUser();
    const [title, setTitle] = useState("");
    const [typingUsers, setTypingUsers] = useState<{ userId: number, name: string }[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [profileImages, setProfileImages] = useState<{ url: string[], alt: string[] } | null>(null);

    useEffect(() => {
        if (!token && !isLoading) {
            router.replace("/");
        }
    }, [token, router, isLoading]);

    useEffect(() => {
        if (!resolvedParams.id) return;
        if (!userId) return;
        const socketInstance = io("http://192.168.1.68:8081");

        socketInstance.on("connect", () => {
            socketInstance.emit("authenticate", {userId, conversationId: resolvedParams.id});
        });

        socketInstance.on("authenticated", ({socketId}) => console.log("Socket.IO conv Id ", socketId));

        socketInstance.on("message", (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        socketInstance.on("message_status", ({id, status, read_at}) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === id ? {...msg, status, read_at} : msg
                )
            );
        });

        socketInstance.on("user_typing", ({userId: typingUserId, firstName, lastName}) => {
            if (typingUserId !== userId) {
                setTypingUsers((prev) => {
                    if (!prev.some(user => user.userId === typingUserId)) {
                        return [...prev, {userId: typingUserId, name: `${firstName} ${lastName}`}];
                    }
                    return prev;
                });
            }
        });

        socketInstance.on("user_stopped_typing", ({userId: stoppedUserId}) => {
            if (stoppedUserId !== userId) {
                setTypingUsers((prev) => prev.filter(user => user.userId !== stoppedUserId));
            }
        });

        socketInstance.on("connect_error", (error: Error) => console.error("Socket.IO connection error", error));
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
                if (msg.status === "delivered" && msg.author_id !== userId) {
                    socket?.emit("mark_as_read", {
                        messageId: msg.id,
                        conversationId: resolvedParams.id,
                        readerId: userId
                    });
                }
            });
        }
    }, [messages, resolvedParams.id, socket, userId]);

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

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop_typing", {conversationId: resolvedParams.id, userId});
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    useEffect(() => {
        const readMessage = [...messages]
            .reverse()
            .find((msg) => msg.author_id === userId && msg.read_at);

        setLastReadMessage(readMessage ?? null);

        const distributedMessage = [...messages]
            .reverse()
            .find((msg) => msg.author_id === userId && msg.status === "delivered");

        setLastDistributedMessage(distributedMessage ?? null);
    }, [messages, userId]);

    useEffect(() => {
        document.title = "Messenger | " + title;
    }, [title]);

    return (
        <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-sky-200/80 bg-[#f9fcff]/96 shadow-2xl shadow-sky-950/15 backdrop-blur-2xl dark:border-[#1b263a] dark:bg-[#0b1426]/96 dark:shadow-black/40">
            <header className="flex items-center gap-3 border-b border-sky-200/80 bg-[#edf6ff] px-3 py-3 backdrop-blur-xl sm:px-5 dark:border-[#1b263a] dark:bg-[#111c31]">
                <Link
                    href="/conversations"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white text-slate-600 shadow-sm shadow-sky-950/8 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-white/10 dark:bg-[#1b2230] dark:text-slate-100 dark:hover:border-cyan-400/40 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Retour"
                >
                    <ArrowLeft size={19}/>
                </Link>
                <AvatarGroup spacing="small" max={4} className="shrink-0">
                    {profileImages?.url?.map((url: string, index) => (
                        <Avatar
                            key={index}
                            src={url}
                            {...stringAvatar(profileImages.alt[index] ?? "")}
                        />
                    ))}
                </AvatarGroup>
                <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
                    <p className="text-sm text-slate-500 dark:text-blue-200/70">Discussion active</p>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col bg-[#e3f0ff] dark:bg-[#07101f]">
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 scrollbar-custom sm:px-5">
                    {messages.map((message, index) => {
                        const isCurrentUser = message.author_id === userId;
                        const isLastRead = lastReadMessage?.id === message.id;
                        const isLastDistributed = lastDistributedMessage?.id === message.id;

                        const previousMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];
                        const isDifferentAuthor = !previousMessage || previousMessage.author_id !== message.author_id;
                        const isLastFromAuthor = !nextMessage || nextMessage.author_id !== message.author_id;

                        return (
                            <div
                                key={message.id}
                                className={`relative flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                            >
                                {isDifferentAuthor && (
                                    <p className="my-3 w-full text-center text-xs font-medium text-blue-900/[0.35] dark:text-blue-200/40">
                                        {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                )}
                                <div className={`flex w-full ${isCurrentUser ? "flex-row-reverse pl-12" : "flex-row pr-12"}`}>
                                    <div className="flex w-12 flex-shrink-0 items-end justify-center p-1">
                                        {isLastFromAuthor && (
                                            <Avatar
                                                key={index}
                                                src={message.profile_image}
                                                {...stringAvatar(`${message.first_name} ${message.last_name}`)}
                                                sx={{
                                                    ...stringAvatar(`${message.first_name} ${message.last_name}`).sx,
                                                    width: 34,
                                                    height: 34,
                                                    fontSize: 13,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="group relative">
                                        <div
                                            className={`my-1 max-w-xl break-words rounded-lg px-4 py-2.5 text-sm leading-6 shadow-sm ${
                                                isCurrentUser
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-950/40"
                                                : "border border-sky-200/80 bg-white text-slate-800 shadow-md shadow-sky-950/8 backdrop-blur-sm dark:border-white/10 dark:bg-[#151c2a] dark:text-slate-100 dark:shadow-black/20"
                                            } whitespace-normal`}
                                        >
                                            <p>{message.content}</p>
                                        </div>
                                        {isCurrentUser && (
                                            (message.status === "sent" || message.status === "delivered" || (isLastRead && message.read_at)) && (
                                                <span className="mb-1 block text-right text-xs text-slate-500 dark:text-blue-200/[0.65]">
                                                    {message.status === "sent" && "Envoye"}
                                                    {isLastDistributed && message.status === "delivered" && "Distribue"}
                                                    {isLastRead && message.read_at ? `Lu a ${new Date(message.read_at).toLocaleTimeString()}` : ""}
                                                </span>
                                            )
                                        )}
                                        <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-md group-hover:flex">
                                            {new Date(message.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {typingUsers.length > 0 && (
                        <p className="ml-14 mt-2 text-sm text-slate-500 dark:text-blue-200/70">
                            {typingUsers.map(user => user.name).join(", ")} {typingUsers.length > 1 ? "sont" : "est"} en cours de saisie...
                        </p>
                    )}
                    <div ref={messagesEndRef}/>
                </div>

                <form
                    className="border-t border-sky-200/80 bg-[#edf6ff]/94 p-3 backdrop-blur-2xl sm:p-4 dark:border-white/10 dark:bg-[#0b1426]/95"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                >
                    <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white p-1.5 shadow-xl shadow-sky-950/10 backdrop-blur-xl focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 dark:border-white/10 dark:bg-[#151c2a] dark:shadow-black/30 dark:focus-within:border-cyan-400/50 dark:focus-within:ring-cyan-400/10">
                        <input
                            type="text"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-blue-200/[0.45]"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            placeholder="Tapez votre message..."
                        />
                        <button
                            type="submit"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:bg-slate-300 dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-700"
                            disabled={!newMessage.trim()}
                            aria-label="Envoyer"
                        >
                            <SendHorizonal size={18}/>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
