import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {UserProvider} from "@/app/UserContext";
import NotificationPopup from "@/app/components/NotificationPopup";
import LogoutButton from "@/app/components/LogoutButton";
import Favicon from "./favicon.ico"


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: 'Messenger',
    openGraph: {
        title: 'Messenger',
        description: 'Messagerie en ligne',
    },
    icons: "/favicon.ico",
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="fr">
        <head>
            <link rel="icon" href={Favicon.src} sizes="any"/>
            <title>Messenger</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
            <nav className="navbar navbar-expand-lg p-2 navbar-dark bg-blue-400">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Messenger</h1>
                    <div className="flex gap-4">
                        <NotificationPopup/>
                        <LogoutButton/>
                    </div>
                </div>
            </nav>
            <div className="bg-blue-200">{children}</div>
        </UserProvider>
        </body>
        </html>
    );
}
