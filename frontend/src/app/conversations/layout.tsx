import React from "react";
import Navbar from "@/components/NavBar";

export default function ConversationLayout({
                                               children,
                                           }: {
    children: React.ReactNode;
}) {
    return (
        <section className="flex h-dvh max-h-dvh min-w-screen flex-col overflow-x-hidden bg-[#d7e8ff] dark:bg-[#01040c]">
            <Navbar/>
            <div className="flex min-h-0 flex-grow px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
                {children}
            </div>
        </section>
    );
}
