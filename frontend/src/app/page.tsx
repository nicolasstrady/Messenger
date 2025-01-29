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
        <div className="bg-red-50">
            <h1>Connexion</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button className="bg-red-600" type="submit">Se connecter</button>
            </form>
            {error && <p style={{color: "red"}}>{error}</p>}
        </div>
    );
}
