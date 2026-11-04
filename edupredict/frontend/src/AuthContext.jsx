import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("edupredict_token"));

  useEffect(() => {
    if (!localStorage.getItem("edupredict_token")) return;
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("edupredict_token"))
      .finally(() => setLoading(false));
  }, []);

  const accept = ({ token, user }) => {
    localStorage.setItem("edupredict_token", token);
    setUser(user);
    return user;
  };
  const login = async (email, password) => accept((await api.post("/auth/login", { email, password })).data);
  const register = async (body) => accept((await api.post("/auth/register", body)).data);
  const logout = () => {
    localStorage.removeItem("edupredict_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
