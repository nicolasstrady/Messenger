'use client';

import React, {useState} from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {useUser} from "@/app/UserContext";
import NotificationPopup from "./NotificationPopup";
import {LogOut, MessageCircle} from "lucide-react";
import {stringAvatar} from "@/utils/AvatarUtils";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
    const {first_name, last_name, profile_image, logout} = useUser();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <nav
            className="sticky top-0 z-40 border-b border-sky-300/60 bg-[#dcebff]/88 px-3 py-2 shadow-lg shadow-sky-950/10 backdrop-blur-2xl sm:px-5 dark:border-white/10 dark:bg-[#0a1324]/95 dark:shadow-black/30">
            <div className="flex h-12 w-full items-center justify-between">
                <Link href="/conversations"
                      className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-amber-100/60 dark:hover:bg-white/[0.08]">
                    <span
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-blue-500 dark:shadow-blue-950/50">
                        <MessageCircle size={20}/>
                    </span>
                    <span
                        className="hidden text-sm font-semibold tracking-wide text-slate-950 sm:block dark:text-blue-50">Messenger</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ThemeToggle/>
                    <NotificationPopup/>

                    <Tooltip title="Profil">
                        <IconButton onClick={handleClick} size="small" sx={{p: 0.5}}>
                            <Avatar
                                src={profile_image || undefined}
                                {...stringAvatar(`${first_name} ${last_name}`)}
                                sx={{
                                    ...stringAvatar(`${first_name} ${last_name}`).sx,
                                    width: 38,
                                    height: 38,
                                    border: "2px solid white",
                                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.16)",
                                    fontSize: 14,
                                }}
                            />
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                mt: 1.5,
                                border: "1px solid #e4e7ef",
                                borderRadius: "8px",
                                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                                '& .MuiMenuItem-root': {px: 2, py: 1.25, gap: 1.25, fontSize: 14},
                                '@media (prefers-color-scheme: dark)': {},
                            },
                        }}
                    >
                        <MenuItem onClick={logout}>
                            <LogOut size={18}/>
                            Se deconnecter
                        </MenuItem>
                    </Menu>
                </div>
            </div>
        </nav>
    );
}
