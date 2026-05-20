"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {Camera, LockKeyhole, Mail, MessageCircle, User, X} from "lucide-react";

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
            formDataToSend.append('profile_image', profileImage);
        }

        try {
            const response = await fetch("http://192.168.1.68:8000/register", {
                method: "POST",
                body: formDataToSend,
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/");
            } else {
                setError(data.error || "Une erreur est survenue");
            }
        } catch {
            setError("Impossible de se connecter au serveur.");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setProfileImage(file);
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
    };

    const imageUrl = profileImage ? URL.createObjectURL(profileImage) : "/avatar.png";
    const inputClass = "w-full rounded-lg border border-blue-100 bg-white/80 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-blue-200/[0.45] dark:focus:border-blue-400/50 dark:focus:bg-white/10 dark:focus:ring-blue-400/10";

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl rounded-lg border border-blue-100/70 bg-white/75 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:bg-slate-950/[0.45] dark:shadow-black/35">
                <div className="mb-7 flex items-center justify-between gap-4">
                    <div>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <MessageCircle size={23}/>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Inscription</p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Creer votre profil</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-blue-200/70">Ajoutez vos informations et un avatar pour demarrer.</p>
                    </div>
                </div>

                {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

                <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-[13rem_1fr]">
                    <div className="flex flex-col items-center rounded-lg border border-blue-100 bg-white/55 p-5 shadow-sm shadow-blue-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt="Avatar"
                                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg shadow-slate-900/10"
                            />
                            <label
                                htmlFor="profile-image"
                                className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                                aria-label="Changer l'avatar"
                            >
                                <Camera size={18}/>
                            </label>
                            <input
                                type="file"
                                id="profile-image"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                        {profileImage && (
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:text-red-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-blue-100 dark:hover:border-red-300/40 dark:hover:text-red-200"
                            >
                                <X size={15}/>
                                Supprimer
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Prenom</span>
                                <span className="relative block">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="text" name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Votre prenom" required/>
                                </span>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Nom</span>
                                <span className="relative block">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input type="text" name="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Votre nom" required/>
                                </span>
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Pseudo</span>
                            <span className="relative block">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="text" name="pseudo" value={userName} onChange={(e) => setUserName(e.target.value)} className={inputClass} placeholder="Votre pseudo" required/>
                            </span>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Email</span>
                            <span className="relative block">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="votre@email.fr" required/>
                            </span>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Mot de passe</span>
                            <span className="relative block">
                                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Votre mot de passe" required/>
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                        >
                            S&apos;inscrire
                        </button>

                        <div className="text-center text-sm text-slate-500 dark:text-blue-200/70">
                            Deja un compte ?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                            >
                                Se connecter
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default RegisterPage;
