import { createContext, useContext, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );

    const login = async (email, password) => {
        const response = await API.post("/auth/login", {
            email,
            password
        });

        const { user, session } = response.data;

        localStorage.setItem("token", session.access_token);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
    };

    const register = async (full_name, email, password) => {
        return await API.post("/auth/register", {
            full_name,
            email,
            password
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);