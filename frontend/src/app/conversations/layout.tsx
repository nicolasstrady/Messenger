import Link from "next/link";
import React from "react";
import NotificationPopup from "@/components/NotificationPopup";
import LogoutButton from "@/components/LogoutButton";
import Navbar from "@/components/NavBar";

export default function ConversationLayout({
                                               children,
                                           }: {
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col h-screen">
            <Navbar/>
            {/* Contenu qui prend le reste de la page */}
            <div className="flex-1 px-4 bg-gray-200">
                {children}
            </div>
        </section>
    );
}
