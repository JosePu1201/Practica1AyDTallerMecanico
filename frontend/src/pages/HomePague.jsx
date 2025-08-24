// src/pages/HomePague.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function HomePague() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (user.rol === 1) navigate("/admin", { replace: true });
    else if (user.rol === 2) navigate("/employee", { replace: true });
    else navigate("/no-autorizado", { replace: true });
  }, [user, loading, navigate]);

  return null;
}
