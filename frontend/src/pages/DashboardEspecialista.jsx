// /employee/DashboardEmpleado.jsx
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
            <i
              className={`bi ms-auto ${
                open ? "bi-chevron-up" : "bi-chevron-down"
              }`}
            />
          )}
        </button>
        <div
          className="submenu"
          style={{
            height: open && !collapsed ? children.length * 40 : 0,
          }}
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
    () => localStorage.getItem("specialistSidebarCollapsed") === "1"
  );
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    localStorage.setItem("specialistSidebarCollapsed", newValue ? "1" : "0");
  };

  /*const handleLogout = () => {
    axios.post('/api/personas/logout')
      .then(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('specialistSidebarCollapsed');
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('specialistSidebarCollapsed');
        navigate('/', { replace: true });
      });
  };*/

  const handleLogout = async () => {
    // First clear all local storage items to ensure clean logout
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("specialistSidebarCollapsed");
    
    try {
      // Make logout request after clearing storage
      // This way, even if the request fails, the user is still logged out locally
      await axios({
        method: 'post',
        url: '/api/personas/logout',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log("Logout API error:", error);
      // Silently fail - we've already cleared storage
    }
    
    // Navigate after everything else
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "SP";
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            title="Collapse sidebar"
          >
            <i className="bi bi-list" />
          </button>
          {!collapsed && <h5 className="mb-0">Panel Especialista</h5>}
        </div>

        <nav className="menu">
          <SidebarItem
            icon="bi-speedometer2"
            label="Dashboard"
            to="/specialist"
            collapsed={collapsed}
          />

          <SidebarItem
            icon="bi-wrench"
            label="Trabajos"
            collapsed={collapsed}
            children={[
              { label: "Trabajos Asignados", to: "/specialist/works" },
              { label: "Historial de Trabajos", to: "/specialist/works/history" },
            ]}
          />

          <SidebarItem
            icon="bi-clipboard-check"
            label="Diagnósticos"
            collapsed={collapsed}
            children={[
              { label: "Crear Diagnóstico", to: "/specialist/diagnostics/create" },
              { label: "Mis Diagnósticos", to: "/specialist/diagnostics" },
            ]}
          />

          <SidebarItem
            icon="bi-tools"
            label="Pruebas Técnicas"
            collapsed={collapsed}
            children={[
              { label: "Nueva Prueba", to: "/specialist/tests/create" },
              { label: "Mis Pruebas", to: "/specialist/tests" },
            ]}
          />

          <SidebarItem
            icon="bi-chat-square-text"
            label="Comentarios"
            collapsed={collapsed}
            children={[
              { label: "Agregar Comentario", to: "/specialist/comments/create" },
              { label: "Mis Comentarios", to: "/specialist/comments" },
            ]}
          />

          <SidebarItem
            icon="bi-star"
            label="Recomendaciones"
            collapsed={collapsed}
            children={[
              { label: "Nueva Recomendación", to: "/specialist/recommendations/create" },
              { label: "Mis Recomendaciones", to: "/specialist/recommendations" },
            ]}
          />

          <SidebarItem
            icon="bi-people"
            label="Apoyo"
            collapsed={collapsed}
            children={[
              { label: "Solicitar Apoyo", to: "/specialist/support/create" },
              { label: "Mis Solicitudes", to: "/specialist/support" },
            ]}
          />

          <SidebarItem
            icon="bi-boxes"
            label="Repuestos"
            collapsed={collapsed}
            children={[
              { label: "Solicitudes", to: "/specialist/parts/requests" },
            ]}
          />

          <SidebarItem
            icon="bi-person"
            label="Mi Perfil"
            to="/specialist/profile"
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

            <button
              className="profile-chip"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="avatar">
                {getInitials(user?.username)}
              </div>
              <span className="profile-name">{user?.username}</span>
              <i className="bi bi-chevron-down" />
            </button>

            {menuOpen && (
              <div className="profile-menu">
                <NavLink to="/specialist/profile" className="profile-item">
                  <i className="bi bi-person" />
                  Mi Perfil
                </NavLink>
                <NavLink to="/specialist/settings" className="profile-item">
                  <i className="bi bi-gear" />
                  Configuración
                </NavLink>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="profile-item">
                  <i className="bi bi-box-arrow-right" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
