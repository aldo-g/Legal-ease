import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking for a logged-in user from localStorage
        const savedUser = localStorage.getItem('le_auth_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = { id: 'user_123', email, name: email.split('@')[0] };
                setUser(mockUser);
                localStorage.setItem('le_auth_user', JSON.stringify(mockUser));
                resolve(mockUser);
            }, 1000);
        });
    };

    const signup = async (name, email, password) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = { id: 'user_' + Math.random().toString(36).substr(2, 9), email, name };
                setUser(mockUser);
                localStorage.setItem('le_auth_user', JSON.stringify(mockUser));
                resolve(mockUser);
            }, 1000);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('le_auth_user');
        // Clear user-specific claim data if needed or keep it for the next session
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
