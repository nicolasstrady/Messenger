"use client";

import {Moon, Sun} from "lucide-react";
import {useEffect, useState} from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = savedTheme ?? (prefersDark ? "dark" : "light");

        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";

        setTheme(nextTheme);
        localStorage.setItem("theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100/80 bg-white/75 text-slate-700 shadow-sm shadow-blue-950/5 backdrop-blur-xl transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:shadow-black/20 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/10 dark:hover:text-white"
            aria-label={theme === "dark" ? "Activer le theme clair" : "Activer le theme sombre"}
        >
            {theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
        </button>
    );
}
