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
    if (user.nombre_rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else if (user.nombre_rol === 'EMPLEADO') {
        navigate('/employee', { replace: true });
      } else if (user.nombre_rol === 'ESPECIALISTA') {
        navigate('/specialist', { replace: true });
      }
      else {navigate("/no-autorizado", { replace: true })};
  }, [user, loading, navigate]);

  return null;
}
