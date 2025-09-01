import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./stiles/empleado.css";
import axios from "axios";

export default function DashboardEmpleado() {
  const navigate = useNavigate();

  // === Estado colapsable ===
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("employeeSidebarCollapsed") === "1"
  );

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // === Ajustes / autenticación ===
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autenticacion, setAutenticacion] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [flash, setFlash] = useState(null); // {type:'ok'|'error', text:string}

  // Cargar valor inicial desde localStorage
  useEffect(() => {
    const raw = localStorage.getItem("autenticacion");
    setAutenticacion(String(raw) === "true");
  }, []);

  // Cambiar autenticación (optimista con revert en error)
  const cambiarConfiguracion = async () => {
    if (loadingAuth) return;
    setLoadingAuth(true);

    const nuevoValor = !autenticacion;
    setAutenticacion(nuevoValor); // optimista
    localStorage.setItem("autenticacion", nuevoValor ? "true" : "false");

    try {
      const { data } = await axios.put(
        "/api/personas/cambiar-autenticacion",
        { autenticacion: nuevoValor }
      );
      const msg =
        data?.mensaje || "Autenticación de dos factores actualizada correctamente";
      setFlash({ type: "ok", text: msg });

      // cerrar modal y ocultar toast
      setTimeout(() => {
        setSettingsOpen(false);
        setFlash(null);
      }, 1800);
    } catch (err) {
      console.error("Error cambiando autenticación", err);

      // revertir
      setAutenticacion(!nuevoValor);
      localStorage.setItem("autenticacion", !nuevoValor ? "true" : "false");

      setFlash({ type: "error", text: "No se pudo actualizar la autenticación" });
      setTimeout(() => setFlash(null), 2200);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Cargar usuario
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("employeeSidebarCollapsed", next ? "1" : "0");
  };

  const initials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "EM";

  const onLogout = async () => {
    try {
      await axios.post("/api/personas/logout");
    } catch (_) {
      // no-op
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("autenticacion");
      localStorage.removeItem("token");
      localStorage.removeItem("employeeSidebarCollapsed");
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <i className="bi bi-list" />
          </button>
          {!collapsed && <h5 className="m-0">Empleado</h5>}
        </div>

        <nav className="menu">
          <NavLink
            to="/employee/infopersonal"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Resumen"
          >
            <i className="bi bi-speedometer2 me-2" />
            {!collapsed && <span>Resumen</span>}
          </NavLink>

          <NavLink
            to="/employee/tasks"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Trabajos"
          >
            <i className="bi bi-wrench-adjustable me-2" />
            {!collapsed && <span>Trabajos</span>}
          </NavLink>
          <NavLink
            to="/employee/mis-avances"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Mis avances"
          >
            <i className="bi bi-graph-up me-2" />
            {!collapsed && <span>Mis avances</span>}
          </NavLink>

          <NavLink
            to="/employee/mis-observaciones"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Mis observaciones"
          >
            <i className="bi bi-chat-left-text me-2" />
            {!collapsed && <span>Mis observaciones</span>}
        </NavLink>

        </nav>

        {!collapsed && <div className="sidebar-footer">v1.0</div>}
      </aside>

      {/* Área principal */}
      <div className="main">
        <header className="topbar">
          <div className=""></div>

          {/* Perfil / menú */}
          <div className="top-actions" ref={menuRef}>
            <button className="icon-btn" title="Notificaciones">
              <i className="bi bi-bell" />
            </button>
            <button
              className="icon-btn"
              title="Ajustes"
              onClick={() => setSettingsOpen(true)}
            >
              <i className="bi bi-gear" />
            </button>

            <button
              className="profile-chip"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.nombre_usuario || "Empleado"}
            >
              <div className="avatar">{initials(user?.nombre_usuario)}</div>
              <span className="profile-name" style={{ color: "#000" }}>
                {user?.nombre_usuario || "Empleado"}
              </span>
              <i className={`bi ${menuOpen ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} />
            </button>

            {menuOpen && (
              <div className="profile-menu" role="menu">
                <button className="profile-item" onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Salir
                </button>
              </div>
            )}

            {/* Modal de ajustes */}
            {settingsOpen && (
              <div
                className="modal open"
                onClick={(e) => {
                  if (e.target.classList.contains("modal")) setSettingsOpen(false);
                }}
              >
                <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="cfg-title">
                  <h3 id="cfg-title">Configuraciones</h3>

                  <div className="list" style={{ marginTop: 10 }}>
                    <div
                      className="list-item"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    >
                      <div>
                        <strong>Autenticación a dos pasos</strong>
                        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                          Activa o desactiva la autenticación a dos pasos.
                        </div>
                      </div>

                      <button
                        onClick={cambiarConfiguracion}
                        className="btn"
                        disabled={loadingAuth}
                        style={{
                          background: autenticacion ? "#10b981" : "#ef4444",
                        }}
                      >
                        {loadingAuth
                          ? "Guardando..."
                          : autenticacion
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setSettingsOpen(false)}>
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <div className="card-surface">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast de feedback */}
      {flash && (
        <div
          role="status"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            background: flash.type === "error" ? "#b91c1c" : "#0f766e",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,.35)",
            zIndex: 10000,
            fontWeight: 600,
          }}
        >
          {flash.text}
        </div>
      )}
    </div>
  );
}
