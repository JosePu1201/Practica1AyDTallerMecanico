// /employee/DashboardEmpleado.jsx  (Especialista)
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./stiles/dashboard.css";

function SidebarItem({ icon, label, to, children, collapsed }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (children?.some((ch) => location.pathname.startsWith(ch.to))) {
      setOpen(true);
    }
  }, [location.pathname, children]);

  if (children && children.length) {
    return (
      <div className={`menu-item ${open ? "open" : ""}`}>
        <button
          type="button"
          className="menu-btn"
          onClick={() => setOpen(!open)}
          title={label}
        >
          <i className={`bi ${icon} me-2`} />
          {!collapsed && <span>{label}</span>}
          {!collapsed && (
            <i className={`bi ms-auto ${open ? "bi-chevron-up" : "bi-chevron-down"}`} />
          )}
        </button>
        <div
          className="submenu"
          style={{ height: open && !collapsed ? children.length * 40 : 0 }}
        >
          {children.map((ch) => (
            <NavLink key={ch.to} to={ch.to} end className="submenu-link">
              <span>{ch.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
      title={label}
    >
      <i className={`bi ${icon} me-2`} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function DashboardEmpleado() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("clientSidebarCollapse") === "1"
  );
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // === Ajustes / autenticación (igual que Admin/Empleado) ===
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autenticacion, setAutenticacion] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [flash, setFlash] = useState(null); // {type:'ok'|'error', text:string}

  // Load user from localStorage
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

  // Close menu on outside click
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
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("clientSidebarCollapse", newValue ? "1" : "0");
  };

  // Cargar valor inicial autenticación
  useEffect(() => {
    const raw = localStorage.getItem("autenticacion");
    setAutenticacion(String(raw) === "true");
  }, []);

  // PUT para cambiar autenticación (optimista con revert)
  const toggleAutenticacion = async () => {
    if (authPending) return;
    setAuthPending(true);

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
      setAuthPending(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("autenticacion");
    localStorage.removeItem("clientSidebarCollapse");
    try {
      await axios.post("/api/personas/logout");
    } catch {
      /* noop */
    }
    navigate("/login", { replace: true });
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SP";

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <button className="toggle-btn" onClick={toggleSidebar} title="Collapse sidebar">
            <i className="bi bi-list" />
          </button>
          {!collapsed && <h5 className="mb-0">Panel Cliente</h5>}
        </div>

        <nav className="menu">
          <SidebarItem
            icon="bi-speedometer2"
            label="Dashboard"
            to="/client"
            collapsed={collapsed}
          />
          
          <SidebarItem
            icon="bi-car-front"
            label="Mis Vehículos"
            collapsed={collapsed}
            children={[
              { label: "Lista de Vehículos", to: "/client/vehicles" }
            ]}
          />
          
          <SidebarItem
            icon="bi-tools"
            label="Servicios"
            collapsed={collapsed}
            children={[
              { label: "Servicios Activos", to: "/client/services" },
              { label: "Servicios Adicionales", to: "/client/services/additional" },
              { label: "Solicitar Cotización", to: "/client/services/quote" },
              { label: "Mis Cotizaciones", to: "/client/services/quotes" }
            ]}
          />
          
          <SidebarItem
            icon="bi-chat-quote"
            label="Seguimiento"
            collapsed={collapsed}
            children={[
              { label: "Comentarios", to: "/client/comments" },
              { label: "Calificar Servicio", to: "/client/rating" }
            ]}
          />
          
          <SidebarItem
            icon="bi-cash-coin"
            label="Pagos"
            to="/client/invoices"
            collapsed={collapsed}
          />
          
          <SidebarItem
            icon="bi-person"
            label="Mi Perfil"
            to="/client/profile"
            collapsed={collapsed}
          />
        </nav>

        {!collapsed && <div className="sidebar-footer">Taller Mecanico</div>}
      </aside>

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <div className="search">
            <i className="bi bi-search" />
            <input placeholder="Buscar..." />
          </div>

          <div className="top-actions" ref={menuRef}>
            <button className="icon-btn" title="Notificaciones">
              <i className="bi bi-bell" />
            </button>
            <button className="icon-btn" title="Ayuda">
              <i className="bi bi-question-circle" />
            </button>
            {/* Botón de Ajustes para abrir modal */}
            <button
              className="icon-btn"
              title="Ajustes"
              onClick={() => setSettingsOpen(true)}
            >
              <i className="bi bi-gear" />
            </button>

            <button
              className="profile-chip"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="avatar">{getInitials(user?.nombre_usuario)}</div>
              <span className="profile-name">{user?.nombre_usuario}</span>
              <i className="bi bi-chevron-down" />
            </button>

            {menuOpen && (
              <div className="profile-menu">
                <NavLink to="/client/profile" className="profile-item">
                  <i className="bi bi-person" />
                  Mi Perfil
                </NavLink>
                <button
                  className="profile-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  <i className="bi bi-gear" />
                  Configuración
                </button>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="profile-item">
                  <i className="bi bi-box-arrow-right" />
                  Cerrar Sesión
                </button>
              </div>
            )}

            {/* Modal de Configuraciones */}
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
                        onClick={toggleAutenticacion}
                        className="btn"
                        disabled={authPending}
                        style={{ background: autenticacion ? "#10b981" : "#ef4444" }}
                      >
                        {authPending ? "Guardando..." : autenticacion ? "Desactivar" : "Activar"}
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
          <Outlet />
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
