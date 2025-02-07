"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const formDataToSend = new FormData();
        formDataToSend.append('email', email);
        formDataToSend.append('password', password);
        formDataToSend.append('username', userName);
        formDataToSend.append('first_name', firstName);
        formDataToSend.append('last_name', lastName);
        if (profileImage) {
            formDataToSend.append('profile_image', profileImage); // Ajouter l'image à FormData
        }

        try {
            const response = await fetch("http://192.168.1.68:8000/register", {
                method: "POST",
                body: formDataToSend, // Envoi de FormData
            });

            const data = await response.json();

            if (response.ok) {
                // Rediriger vers la connexion après une inscription réussie
                router.push("/");
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Impossible de se connecter au serveur.");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setProfileImage(file); // Stocke l'image dans l'état
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">📝 Inscription</h1>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Champ Prénom */}
                    <div>
                        <label className="block text-gray-700 font-medium">Prénom</label>
                        <input
                            type="text"
                            name="first_name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                            placeholder="Votre prénom"
                            required
                        />
                    </div>

                    {/* Champ Nom */}
                    <div>
                        <label className="block text-gray-700 font-medium">Nom</label>
                        <input
                            type="text"
                            name="last_name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                            placeholder="Votre nom"
                            required
                        />
                    </div>

                    {/* Champ Pseudo */}
                    <div>
                        <label className="block text-gray-700 font-medium">Pseudo</label>
                        <input
                            type="text"
                            name="pseudo"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                            placeholder="Votre pseudo"
                            required
                        />
                    </div>

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

                    {/* Champ Image de Profil */}
                    <div>
                        <label className="block text-gray-700 font-medium">Image de Profil</label>
                        <input
                            type="file"
                            onChange={handleImageChange}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-red-300"
                        />
                    </div>

                    {/* Bouton S'inscrire */}
                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        S'inscrire
                    </button>
                </form>

                {/* Lien vers la connexion */}
                <div className="text-center mt-4">
                    <p className="text-gray-600 text-sm">Déjà un compte ?</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="mt-2 text-red-600 hover:underline"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
