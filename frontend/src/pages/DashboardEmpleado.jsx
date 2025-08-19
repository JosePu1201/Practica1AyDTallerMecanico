import React, { useMemo, useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import './stiles/empleado.css';

const inicial = [
  { id: "SV-001", cliente: "Juan Pérez",  descripcion: "Cambio de aceite",           estado: "pendiente",   fecha: "2025-08-18" },
  { id: "SV-002", cliente: "María López",  descripcion: "Alineación y balanceo",     estado: "en_progreso", fecha: "2025-08-18" },
  { id: "SV-003", cliente: "Carlos Díaz",  descripcion: "Revisión frenos",           estado: "completado",  fecha: "2025-08-17" },
];

const badgeTone = {
  pendiente:   "badge badge-warn",
  en_progreso: "badge badge-info",
  completado:  "badge badge-ok",
};

export default function DashboardEmpleado() {
  const [servicios, setServicios] = useState(inicial);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const filtrados = useMemo(() => {
    const term = q.toLowerCase().trim();
    return servicios.filter(s => {
      const coincideTexto =
        !term ||
        [s.id, s.cliente, s.descripcion].join(" ").toLowerCase().includes(term);
      const coincideEstado = filtro === "todos" || s.estado === filtro;
      return coincideTexto && coincideEstado;
    });
  }, [servicios, q, filtro]);

  const actualizarEstado = (id, nuevoEstado) => {
    setServicios(prev => prev.map(s => (s.id === id ? { ...s, estado: nuevoEstado } : s)));
  };

  // (Opcional) chip de perfil simple – si ya tienes el de admin puedes reutilizarlo
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  const initials = (name) =>
    (name || "Usuario")
      .trim().split(/\s+/).map(w => w[0]?.toUpperCase()).join("").slice(0,2);

  useEffect(() => {
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.replace("/");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar (solo Servicios) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="toggle-btn" disabled>
            <i className="bi bi-grid" />
          </button>
          <h5 className="m-0">Empleado</h5>
        </div>

        <nav className="menu">
          <NavLink to="/mecanico" end className="menu-link active">
            <i className="bi bi-wrench-adjustable me-2" />
            <span>Servicios</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">v1.0</div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="search">
            <i className="bi bi-search" />
            <input
              placeholder="Buscar (ID, cliente, descripción)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="top-actions" ref={menuRef}>
            <div className="profile-chip" onClick={() => setMenuOpen(v => !v)} role="button">
              <div className="avatar">{initials(user?.nombre_usuario)}</div>
              <span className="profile-name">{user?.nombre_usuario || "Empleado"}</span>
              <i className={`bi ${menuOpen ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} />
            </div>

            {menuOpen && (
              <div className="profile-menu" role="menu">
                <button className="profile-item" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Salir
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <div className="card-surface">
            <div className="card-head">
              <h2 className="card-title">Servicios asignados</h2>
              <div className="filters">
                <select
                  className="select"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completado">Completados</option>
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.id}</td>
                      <td>{s.cliente}</td>
                      <td className="muted">{s.descripcion}</td>
                      <td>
                        <span className={badgeTone[s.estado]}>
                          {s.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td>{s.fecha}</td>
                      <td>
                        <div className="actions">
                          {s.estado !== "en_progreso" && s.estado !== "completado" && (
                            <button
                              className="btn-ghost"
                              onClick={() => actualizarEstado(s.id, "en_progreso")}
                              title="Marcar en progreso"
                            >
                              En progreso
                            </button>
                          )}
                          {s.estado !== "completado" && (
                            <button
                              className="btn-ghost"
                              onClick={() => actualizarEstado(s.id, "completado")}
                              title="Marcar completado"
                            >
                              Completar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty">
                        No hay servicios que coincidan con el filtro/búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="fineprint">
              *Listado de ejemplo con estado local. Conecta tu API para datos reales.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
