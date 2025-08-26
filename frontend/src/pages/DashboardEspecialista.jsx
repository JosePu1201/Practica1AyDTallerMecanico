// /employee/DashboardEmpleado.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./stiles/admin.css";
import axios from "axios";

export default function DashboardEmpleado() {
  const navigate = useNavigate();

  // === Estado colapsable (igual que admin, pero con su propia key) ===
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("specialistSidebarCollapsed") === "1"
  );

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // <-- igual que en Admin

  // Cargar usuario (igual que admin)
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

  // Cerrar menú al hacer clic fuera (igual que admin)
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
    localStorage.setItem("specialistSidebarCollapsed", next ? "1" : "0");
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
      localStorage.removeItem("token");
      localStorage.removeItem("specialistSidebarCollapsed");
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
          {!collapsed && <h5 className="m-0">Especialista</h5>}
        </div>

        <nav className="menu">
          {/* SOLO cambia el menú respecto a Admin */}
          <NavLink
            to="/specialist/infopersonal"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Resumen"
          >
            <i className="bi bi-speedometer2 me-2" />
            {!collapsed && <span>Resumen</span>}
          </NavLink>

          <NavLink
            to="/specialist/tasks"
            end
            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
            title="Trabajos"
          >
            <i className="bi bi-wrench-adjustable me-2" />
            {!collapsed && <span>Trabajos</span>}
          </NavLink>
        </nav>

        {!collapsed && <div className="sidebar-footer">v1.0</div>}
      </aside>

      {/* Área principal */}
      <div className="main">
        <header className="topbar">
          <div className="search">
            <i className="bi bi-search" />
            <input placeholder="Buscar..." />
          </div>

          {/* Perfil / menú — igual que Admin */}
          <div className="top-actions" ref={menuRef}>
            <button className="icon-btn" title="Notificaciones">
              <i className="bi bi-bell" />
            </button>
            <button className="icon-btn" title="Ajustes">
              <i className="bi bi-gear" />
            </button>

            <button
              className="profile-chip"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.username || "Especialista"}
            >
              <div className="avatar">{initials(user?.username)}</div>
              <span className="profile-name">{user?.username || "Especialista"}</span>
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
          </div>
        </header>

        <main className="content">
          <div className="card-surface">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
