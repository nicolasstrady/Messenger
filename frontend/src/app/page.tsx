"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useUser} from "./UserContext";
import {LockKeyhole, Mail, MessageCircle} from "lucide-react";

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
            setUser(data.userId, data.token, data.user_first_name, data.user_last_name, data.user_profile_image);
            router.push("/conversations");
        } catch (err) {
            setError("Erreur lors de la connexion au serveur");
            console.error(err);
        }
    };

    useEffect(() => {
        document.title = "Messenger | Connexion";
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-blue-100/70 bg-white/70 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl md:grid-cols-[1fr_0.92fr] dark:border-white/10 dark:bg-slate-950/[0.45] dark:shadow-black/35">
                <section className="hidden bg-[radial-gradient(circle_at_20%_0%,rgba(147,197,253,0.28),transparent_22rem),linear-gradient(135deg,#1d4ed8_0%,#0f172a_100%)] p-10 text-white md:flex md:flex-col md:justify-between dark:bg-[radial-gradient(circle_at_20%_0%,rgba(96,165,250,0.18),transparent_24rem),linear-gradient(135deg,#08204a_0%,#020817_100%)]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.15] ring-1 ring-white/20">
                            <MessageCircle size={23}/>
                        </span>
                        <span className="text-lg font-semibold">Messenger</span>
                    </div>
                    <div>
                        <h1 className="max-w-sm text-4xl font-semibold leading-tight">Vos conversations dans une interface plus claire.</h1>
                        <p className="mt-4 max-w-md text-sm leading-6 text-blue-100">
                            Retrouvez vos messages, notifications et discussions de groupe dans un espace rapide a parcourir.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm text-blue-100">
                        <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">Messages</div>
                        <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">Groupes</div>
                        <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">Temps reel</div>
                    </div>
                </section>

                <section className="p-6 sm:p-8 md:p-10 dark:bg-white/[0.03]">
                    <div className="mb-8 md:hidden">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <MessageCircle size={23}/>
                        </span>
                    </div>
                    <div className="mb-7">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Connexion</p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Bienvenue</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-blue-200/70">Connectez-vous pour reprendre vos conversations.</p>
                    </div>

                    {error && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-blue-100 bg-white/80 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-blue-200/[0.45] dark:focus:border-blue-400/50 dark:focus:bg-white/10 dark:focus:ring-blue-400/10"
                                    placeholder="votre@email.fr"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-blue-100">Mot de passe</label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-blue-100 bg-white/80 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-blue-200/[0.45] dark:focus:border-blue-400/50 dark:focus:bg-white/10 dark:focus:ring-blue-400/10"
                                    placeholder="Votre mot de passe"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                        >
                            Se connecter
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500 dark:text-blue-200/70">
                        Pas encore de compte ?{" "}
                        <button
                            onClick={() => router.push("/register")}
                            className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                            S&apos;inscrire
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
