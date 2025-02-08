'use client';

import React, {useState} from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {useUser} from "@/app/UserContext"; // Import du contexte utilisateur
import NotificationPopup from "./NotificationPopup";
import LogoutButton from "./LogoutButton";
import {LogOut} from "lucide-react";
import {stringAvatar} from "@/utils/AvatarUtils";

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
        <nav className="navbar navbar-expand-lg p-2 navbar-dark bg-gray-800 h-12">
            <div className="flex justify-between items-center h-full w-full">
                {/* Logo */}
                <Link href="/conversations">
                    <img src="/favicon.ico" alt="Logo" className="h-8 w-8"/>
                </Link>

                <div className="flex gap-2 items-center">
                    {/* Notifications */}
                    <NotificationPopup/>

                    {/* Avatar avec menu */}
                    <Tooltip title="Profil">
                        <IconButton onClick={handleClick} size="small">
                            <Avatar
                                src={profile_image || undefined}
                                {...stringAvatar(`${first_name} ${last_name}`)}>
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    {/* Menu déroulant */}
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        PaperProps={{
                            elevation: 3,
                            sx: {
                                mt: 1.5,
                                '& .MuiMenuItem-root': {px: 2, py: 1},
                            },
                        }}
                    >
                        <MenuItem onClick={logout}>
                            <LogOut size={20}/>
                            Se déconnecter
                        </MenuItem>
                    </Menu>
                </div>
            </div>
        </nav>
    );
}
