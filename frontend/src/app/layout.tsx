import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {UserProvider} from "@/app/UserContext";
import NotificationPopup from "@/components/NotificationPopup";
import LogoutButton from "@/components/LogoutButton";
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
            {children}
        </UserProvider>
        </body>
        </html>
    );
}
