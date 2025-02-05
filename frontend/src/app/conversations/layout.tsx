import Link from "next/link";
import React from "react";
import NotificationPopup from "@/components/NotificationPopup";
import LogoutButton from "@/components/LogoutButton";

export default function ConversationLayout({
                                               children,
                                           }: {
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col h-screen">
            <nav className="navbar navbar-expand-lg p-2 navbar-dark bg-gray-800 h-12">
                <div className="flex justify-between items-center h-full">
                    <Link href={"/conversations"}>
                        <img src="/favicon.ico" alt="Logo" className="h-8 w-8"/>
                    </Link>
                    <div className="flex gap-4">
                        <NotificationPopup/>
                        <LogoutButton/>
                    </div>
                </div>
            </nav>

            {/* Contenu qui prend le reste de la page */}
            <div className="flex-1 px-4 bg-gray-200">
                {children}
            </div>
        </section>
    );
}
