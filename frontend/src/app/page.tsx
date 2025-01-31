"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {useUser} from "./UserContext";

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {setUser} = useUser();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://192.168.1.68:8000/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Erreur inconnue");
                return;
            }

            const data = await response.json();

            // Stocker les données utilisateur dans le contexte
            setUser(data.userId, data.token, data.user_first_name, data.user_last_name); // Stocke l'userId et le token

            // Rediriger vers la page des conversations
            router.push("/conversations");
        } catch (err) {
            setError("Erreur lors de la connexion au serveur");
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">🔑 Connexion</h1>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Champ Email */}
                    <div>
                        <label className="block text-gray-700 font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                            placeholder="Votre email"
                            required
                        />
                    </div>

                    {/* Champ Mot de Passe */}
                    <div>
                        <label className="block text-gray-700 font-medium">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                            placeholder="Votre mot de passe"
                            required
                        />
                    </div>

                    {/* Bouton Se Connecter */}
                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        Se connecter
                    </button>
                </form>

                {/* Lien vers l'inscription */}
                <div className="text-center mt-4">
                    <p className="text-gray-600 text-sm">Pas encore de compte ?</p>
                    <button
                        onClick={() => router.push("/register")}
                        className="mt-2 text-red-600 hover:underline"
                    >
                        S'inscrire
                    </button>
                </div>
            </div>
        </div>
    );
}
