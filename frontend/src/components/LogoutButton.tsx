"use client";

import {useUser} from "@/app/UserContext";
import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";

export default function LogoutButton() {
    const {logout} = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        localStorage.removeItem("token");
        router.replace("/");
    };

    return (
        <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:border-red-200 hover:bg-red-100"
            aria-label="Se deconnecter"
        >
            <LogOut size={18}/>
        </button>
    );
}
