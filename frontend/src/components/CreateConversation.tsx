"use client";

import React, {useEffect, useState} from "react";
import {useUser} from "@/app/UserContext";
import {Plus, Users, X} from "lucide-react";

type User = {
    id: number;
    first_name: string;
    last_name: string;
};

type CreateConversationProps = {
    onConversationCreated: () => void;
};

const CreateConversation: React.FC<CreateConversationProps> = ({onConversationCreated}) => {
    const {userId} = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [title, setTitle] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://192.168.1.68:8000/users");
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Erreur lors de la recuperation des utilisateurs:", error);
            }
        };

        fetchUsers();
    }, []);

    const handleUserSelection = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((selectedUserId) => selectedUserId !== id) : [...prev, id]
        );
    };

    const handleCreateConversation = async () => {
        if (selectedUsers.length === 0) return;

        const participants = [userId, ...selectedUsers];

        try {
            const response = await fetch("http://192.168.1.68:8000/conversations", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({title: title || null, participants, isPrivate: participants.length === 2}),
            });

            if (response.ok) {
                setIsOpen(false);
                setSelectedUsers([]);
                setTitle("");
                onConversationCreated();
            } else {
                console.error("Echec de la creation de la conversation.");
            }
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-950/[0.35] dark:hover:bg-blue-400"
            >
                <Plus size={18}/>
                <span className="hidden sm:inline">Nouvelle</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-lg rounded-lg border border-blue-100/80 bg-white/90 p-5 shadow-2xl shadow-blue-950/[0.15] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/[0.35]">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-slate-900 dark:text-blue-200 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="Fermer"
                        >
                            <X size={18}/>
                        </button>

                        <div className="mb-5 flex items-center gap-3 pr-8">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                                <Users size={20}/>
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Creer une conversation</h2>
                                <p className="text-sm text-slate-500 dark:text-blue-200/70">Selectionnez les participants et lancez l&apos;echange.</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Titre optionnel</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-blue-100 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-blue-200/[0.45] dark:focus:border-blue-400/50 dark:focus:bg-white/10 dark:focus:ring-blue-400/10"
                                placeholder="Nom du groupe"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="mb-5">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Participants</label>
                            <div className="max-h-56 overflow-y-auto rounded-lg border border-blue-100 bg-blue-50/50 p-2 scrollbar-custom dark:border-white/10 dark:bg-white/5">
                                {users
                                    .filter((user) => user.id !== userId)
                                    .map((user) => {
                                        const selected = selectedUsers.includes(user.id);
                                        return (
                                            <label
                                                key={user.id}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${selected ? "bg-blue-100/80 text-blue-950 dark:bg-blue-400/[0.15] dark:text-white" : "text-slate-700 hover:bg-white/80 dark:text-blue-100/75 dark:hover:bg-white/[0.08]"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => handleUserSelection(user.id)}
                                                    className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500 dark:border-white/20"
                                                />
                                                <span className="font-medium">{user.first_name} {user.last_name}</span>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateConversation}
                            disabled={selectedUsers.length === 0}
                            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-700"
                        >
                            Creer la conversation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateConversation;
