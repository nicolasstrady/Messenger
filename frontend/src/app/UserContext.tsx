"use client";

import React, {createContext, useContext, useState, useEffect} from 'react';

type UserContextType = {
    userId: number | null;
    token: string | null;
    first_name: string | null;
    last_name: string | null;
    setUser: (id: number, token: string, first_name: string, last_name: string) => void;
    logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [first_name, setFirstName] = useState<string | null>(null);
    const [last_name, setLastName] = useState<string | null>(null);

    useEffect(() => {
        // Réhydrate les données depuis le localStorage
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        if (storedUserId && storedToken) {
            setUserId(parseInt(storedUserId, 10));
            setToken(storedToken);
        }
    }, []);

    const setUser = (id: number, token: string, first_name: string, last_name: string) => {
        setUserId(id);
        setToken(token);
        setFirstName(first_name);
        setLastName(last_name);
        localStorage.setItem('userId', id.toString());
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUserId(null);
        setToken(null);
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
    };

    return (
        <UserContext.Provider value={{userId, token, first_name, last_name, setUser, logout}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};



