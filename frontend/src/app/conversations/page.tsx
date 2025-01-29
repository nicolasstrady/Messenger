"use client";
import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useUser} from "@/app/UserContext";

type Conversation = {
    name: string;
    id: number;
    other_user_names: string;
};

const Page = () => {
    const {userId, token} = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        // Récupérer les conversations via l'API
        const fetchConversations = async () => {
            const response = await fetch(
                `http://192.168.1.68:8000/conversations/${userId}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            const data = await response.json();
            setConversations(data);
        };
        fetchConversations();
    }, [userId]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Liste des Conversations</h1>
            {conversations.length === 0 ? (
                <p>Pas de conversation</p>
            ) : (
                <ul className="space-y-4">
                    {conversations.map((conversation: Conversation) => (
                        <li key={conversation.id}>
                            <Link
                                href={{
                                    pathname: `/conversations/${conversation.id}`,
                                    query: {
                                        title: conversation.name ?? conversation.other_user_names,
                                    },
                                }}
                            >
                                <div
                                    className="border-2 border-gray-600 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition duration-200"
                                >
                                    <h4 className="text-lg font-semibold">
                                        {conversation.name ?? conversation.other_user_names}
                                    </h4>
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
