// /employee/EmployeeDashboard.jsx
import React, { useMemo, useEffect, useState } from "react";
import axios from "axios";

const fallback = [
  { id:"SV-001", estado:"pendiente"   },
  { id:"SV-002", estado:"en_progreso" },
  { id:"SV-003", estado:"completado"  },
];

export default function InfoPersonal() {
  const [servicios, setServicios] = useState(fallback);

  useEffect(() => {
    // Conecta tu API si ya la tienes:
    // axios.get("/api/empleado/servicios-asignados")
    //   .then(r => setServicios(r.data))
    //   .catch(() => setServicios(fallback));
  }, []);

  const stats = useMemo(() => {
    const total = servicios.length;
    const pendientes  = servicios.filter(s => s.estado === "pendiente").length;
    const enProgreso  = servicios.filter(s => s.estado === "en_progreso").length;
    const completados = servicios.filter(s => s.estado === "completado").length;
    return { total, pendientes, enProgreso, completados };
  }, [servicios]);

  return (
    <>
      <div className="card-head">
        <h2 className="card-title">Resumen personal</h2>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Asignados</div><div className="kpi-value">{stats.total}</div></div>
        <div className="kpi"><div className="kpi-label">Pendientes</div><div className="kpi-value">{stats.pendientes}</div></div>
        <div className="kpi"><div className="kpi-label">En progreso</div><div className="kpi-value">{stats.enProgreso}</div></div>
        <div className="kpi"><div className="kpi-label">Completados</div><div className="kpi-value">{stats.completados}</div></div>
      </div>

      <p className="fineprint">*Conecta tu API para datos en tiempo real.</p>
    </>
  );
}
