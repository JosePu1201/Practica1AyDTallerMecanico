import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './admin.css';

function SidebarItem({ icon, label, to, children, collapsed }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // abre automáticamente si una subruta está activa
  useEffect(() => {
    if (children?.some(ch => location.pathname.startsWith(ch.to))) {
      setOpen(true);
    }
  }, [location.pathname, children]);

  if (children && children.length) {
    return (
      <div className={`menu-item ${open ? 'open' : ''}`}>
        <button type="button" className="menu-btn" onClick={() => setOpen(!open)} title={label}>
          <i className={`bi ${icon} me-2`} />
          {!collapsed && <span>{label}</span>}
          {!collapsed && <i className={`bi ms-auto ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />}
        </button>
        <div className="submenu" style={{ height: open && !collapsed ? children.length * 40 : 0 }}>
          {children.map(ch => (
            <NavLink key={ch.to} to={ch.to} end className="submenu-link">
              <span>{ch.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={to} end className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`} title={label}>
      <i className={`bi ${icon} me-2`} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function DashboardAdmin() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <i className="bi bi-list" />
          </button>
          {!collapsed && <h5 className="m-0">Admin</h5>}
        </div>

        <nav className="menu">
          <SidebarItem icon="bi-house" label="Inicio" to="/admin" collapsed={collapsed} />
          <SidebarItem
            icon="bi-people"
            label="Usuarios"
            collapsed={collapsed}
            children={[
              { label: 'Listado', to: '/admin/usuarios' },
              { label: 'Roles', to: '/admin/usuarios/roles' },
            ]}
          />
          <SidebarItem icon="bi-person-badge" label="Clientes" to="/admin/clientes" collapsed={collapsed} />
          <SidebarItem icon="bi-building-gear" label="Taller" to="/admin/taller" collapsed={collapsed} />
          <SidebarItem icon="bi-wrench-adjustable-circle" label="Servicios" to="/admin/servicios" collapsed={collapsed} />
          <SidebarItem icon="bi-gear" label="Config" to="/admin/config" collapsed={collapsed} />
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
          <div className="top-actions">
            <button className="icon-btn" title="Notificaciones"><i className="bi bi-bell" /></button>
            <button className="icon-btn" title="Ajustes"><i className="bi bi-gear" /></button>
            <div className="avatar" title="Admin">AD</div>
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
