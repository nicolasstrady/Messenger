import React from "react";
import NotificationPopup from "@/components/NotificationPopup";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default function ConversationLayout({
                                               children,
                                           }: {
    children: React.ReactNode;
}) {
    return (
        <section> {/* Ajout d'un padding-top */}
            <nav className="navbar navbar-expand-lg p-2 fixed w-full navbar-dark bg-gray-800 h-12">
                <div className="flex justify-between items-center h-full ">
                    <Link href={"/conversations"}>
                        <img src="/favicon.ico" alt="Logo" className="h-8 w-8"/>
                    </Link>
                    <div className="flex gap-4">
                        <NotificationPopup/>
                        <LogoutButton/>
                    </div>
                </div>
            </nav>
            <div className="px-4 pt-12 bg-red-600">{children}</div>
            {/* Ajout de padding horizontal */}
        </section>
    );
}
