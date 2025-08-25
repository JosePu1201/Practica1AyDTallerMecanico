// /employee/EmployeeTasks.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const badgeTone = {
  pendiente: "badge badge-warn",
  en_progreso: "badge badge-info",
  completado: "badge badge-ok",
};

const fallback = [
  { id:"SV-001", cliente:"Juan Pérez",  descripcion:"Cambio de aceite",      estado:"pendiente",   fecha:"2025-08-18" },
  { id:"SV-002", cliente:"María López", descripcion:"Alineación y balanceo", estado:"en_progreso", fecha:"2025-08-18" },
  { id:"SV-003", cliente:"Carlos Díaz", descripcion:"Revisión frenos",       estado:"completado",  fecha:"2025-08-17" },
];

export default function EmployeeTasks() {
  const [servicios, setServicios] = useState(fallback);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const navigate = useNavigate();

  useEffect(() => {
    // axios.get("/api/empleado/servicios-asignados")
    //   .then(r => setServicios(r.data))
    //   .catch(() => setServicios(fallback));
  }, []);

  const filtrados = useMemo(() => {
    const term = q.toLowerCase().trim();
    return servicios.filter(s => {
      const txt = [s.id, s.cliente, s.descripcion].join(" ").toLowerCase();
      const coincideTexto = !term || txt.includes(term);
      const coincideEstado = filtro === "todos" || s.estado === filtro;
      return coincideTexto && coincideEstado;
    });
  }, [servicios, q, filtro]);

  const actualizarLocal = (id, estado) =>
    setServicios(prev => prev.map(s => (s.id === id ? { ...s, estado } : s)));

  const marcarEnProgreso = async (id) => {
    try {
      // await axios.patch(`/api/empleado/servicios/${id}`, { estado:"en_progreso" });
      actualizarLocal(id, "en_progreso");
    } catch (e) { console.error(e); }
  };

  const marcarCompletado = async (id) => {
    try {
      // await axios.patch(`/api/empleado/servicios/${id}`, { estado:"completado" });
      actualizarLocal(id, "completado");
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <div className="card-head">
        <h2 className="card-title">Trabajos asignados</h2>
        <div className="filters">
          <div className="search">
            <i className="bi bi-search" />
            <input placeholder="Buscar (ID, cliente, descripción)" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
          <select className="select" value={filtro} onChange={(e)=>setFiltro(e.target.value)}>
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
              <th>ID</th><th>Cliente</th><th>Descripción</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(s=>(
              <tr key={s.id}>
                <td className="mono">{s.id}</td>
                <td>{s.cliente}</td>
                <td className="muted">{s.descripcion}</td>
                <td><span className={badgeTone[s.estado]}>{s.estado.replace("_"," ")}</span></td>
                <td>{s.fecha}</td>
                <td>
                  <div className="actions">
                    <button className="btn-ghost" onClick={()=>navigate(`/employee/tasks/${s.id}/work`)}>Trabajar</button>
                    {s.estado!=="en_progreso" && s.estado!=="completado" && (
                      <button className="btn-ghost" onClick={()=>marcarEnProgreso(s.id)}>En progreso</button>
                    )}
                    {s.estado!=="completado" && (
                      <button className="btn-ghost" onClick={()=>marcarCompletado(s.id)}>Completar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length===0 && (
              <tr><td colSpan={6} className="empty">No hay servicios que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="fineprint">*Listado de ejemplo con estado local. Conecta tu API para datos reales.</p>
    </>
  );
}
