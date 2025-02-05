"use client";

import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";

export default function LogoutButton() {
    const {logout} = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logout(); // Appelle la fonction logout du contexte
        localStorage.removeItem("token"); // Supprime le token (ou tout autre méthode)
        router.replace("/"); // Redirige vers la page de connexion
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 transition"
        >
            <LogOut size={20}/>
        </button>
    );
}
