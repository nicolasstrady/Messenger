"use client";

import React, {createContext, useContext, useState, useEffect} from "react";
import io from "socket.io-client";

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

type UserContextType = {
    userId: number | null;
    token: string | null;
    first_name: string | null;
    last_name: string | null;
    notifications: Notification[];
    setUser: (id: number, token: string, first_name: string, last_name: string) => void;
    logout: () => void;
    clearNotification: (conversationId: number) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [first_name, setFirstName] = useState<string | null>(null);
    const [last_name, setLastName] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 🔔 Connexion WebSocket pour les notifications en temps réel
    useEffect(() => {
        if (!userId) return;

        const socket = io("http://192.168.1.68:8081");

        socket.on("connect", () => {
            console.log("🔌 Connexion WebSocket");
            socket.emit("authenticate", {userId});
        });

        socket.on("authenticated", ({socketId}) => console.log("Socket.IO context ", socketId));

        socket.on("new_notification", (notification: Notification) => {
            console.log("📩 Nouvelle notif", notification);
            setNotifications((prev) => [...prev, notification]);
        });

        socket.on("disconnect", () => {
            console.log("🔌 Déconnexion WebSocket");
        });

        return () => {
            socket.disconnect();
        };
    }, [userId]);

    // ✅ Supprime les notifications d'une conversation
    const clearNotification = (conversationId: number) => {
        setNotifications((prev) => prev.filter((n) => n.conversation_id !== conversationId));
    };

    // 🆔 Connexion utilisateur
    const setUser = (id: number, token: string, first_name: string, last_name: string) => {
        setUserId(id);
        setToken(token);
        setFirstName(first_name);
        setLastName(last_name);
        localStorage.setItem("userId", id.toString());
        localStorage.setItem("token", token);
    };

    // 🚪 Déconnexion
    const logout = () => {
        setUserId(null);
        setToken(null);
        setNotifications([]);
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
    };

    return (
        <UserContext.Provider
            value={{userId, token, first_name, last_name, notifications, setUser, logout, clearNotification}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
