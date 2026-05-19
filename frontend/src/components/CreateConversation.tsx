"use client";

import React, {useEffect, useState} from "react";
import {useUser} from "@/app/UserContext";

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

    // 🔄 Récupération de la liste des utilisateurs
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://192.168.1.68:8000/users");
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Erreur lors de la récupération des utilisateurs:", error);
            }
        };

        fetchUsers();
    }, []);

    // ✅ Fonction pour gérer la sélection des utilisateurs
    const handleUserSelection = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };

    // ✅ Création de la conversation
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
                onConversationCreated(); // Rafraîchir la liste des conversations
            } else {
                console.error("Échec de la création de la conversation.");
            }
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    return (
        <div>
            {/* ✅ Bouton pour ouvrir la modal */}
            <button onClick={() => setIsOpen(true)}
                    className="text-white bg-gray-300 hover:bg-blue-700 px-4 py-2 rounded-lg">
                ➕
            </button>

            {/* ✅ Modal */}
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                        {/* ❌ Bouton de fermeture */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                        >
                            ✖
                        </button>
                        <h2 className="text-lg font-bold mb-4">Créer une conversation</h2>

                        {/* ✅ Champ de titre (facultatif) */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium">Titre (optionnel)</label>
                            <input
                                type="text"
                                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
                                placeholder="Titre de la conversation"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* ✅ Liste des utilisateurs */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium">Participants</label>
                            <div className="max-h-40 overflow-y-auto border p-2 rounded-md">
                                {users
                                    .filter((user) => user.id !== userId) // Exclure l'utilisateur courant
                                    .map((user) => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleUserSelection(user.id)}
                                                className="w-4 h-4"
                                            />
                                            <span>{user.first_name} {user.last_name}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* ✅ Bouton de validation */}
                        <button
                            onClick={handleCreateConversation}
                            disabled={selectedUsers.length === 0}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                        >
                            Créer la conversation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateConversation;
