// /employee/EmployeeDashboard.jsx
import React, { useMemo, useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
} from "recharts";

// Helpers
const normEstado = (e) => (e ?? "").toString().trim().toUpperCase();
const humanEstado = (e) => (e ? e.replaceAll("_", " ").toLowerCase() : "—");
const fmtFecha = (f) => {
  if (!f) return "—";
  try {
    const d = new Date(f);
    return isNaN(d.getTime()) ? "—" : d.toISOString().split("T")[0];
  } catch { return "—"; }
};
const ESTADOS = ["ASIGNADO", "EN_PROCESO", "PAUSADO", "COMPLETADO", "CANCELADO"];
const statusColor = {
  ASIGNADO:   "#f59e0b",
  EN_PROCESO: "#0ea5e9",
  PAUSADO:    "#9ca3af",
  COMPLETADO: "#10b981",
  CANCELADO:  "#ef4444",
};

// --- Highlight helper (sin dangerouslySetInnerHTML)
const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function highlight(text, tokens) {
  if (!text || tokens.length === 0) return text;
  const pattern = tokens.map(escapeReg).join("|");
  const re = new RegExp(`(${pattern})`, "ig");
  const parts = String(text).split(re);
  return parts.map((p, i) =>
    re.test(p) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
  );
}

export default function EmployeeDashboard() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Filtros
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  // Buscador
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setErr(null);
      let user = null;
      try {
        const raw = localStorage.getItem("user");
        user = raw ? JSON.parse(raw) : null;
      } catch { /* noop */ }

      if (!user?.id_usuario) {
        setServicios([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/api/empleados/asignaciones/${user.id_usuario}`);
        const data = res?.data ?? [];
        setServicios(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar las asignaciones.");
        setServicios([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Tokens del buscador (min. 2 chars por token)
  const tokens = useMemo(() => debouncedQ
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2)
  , [debouncedQ]);

  // Filtrar dataset (fecha + estado + búsqueda)
  const filtrados = useMemo(() => {
    const dMin = desde ? new Date(desde) : null;
    const dMax = hasta ? new Date(hasta) : null;
    const endDay = dMax ? new Date(hasta + "T23:59:59.999") : null;

    return servicios.filter((s) => {
      const estNorm = normEstado(s.estado);
      if (estadoFiltro !== "todos" && estNorm !== estadoFiltro) return false;

      const f = s.fecha_asignacion ? new Date(s.fecha_asignacion) : null;
      if (dMin && (!f || f < dMin)) return false;
      if (endDay && (!f || f > endDay)) return false;

      if (tokens.length === 0) return true;

      // Campos buscables
      const empleado = (s.usuarioEmpleado?.nombre_usuario ?? s.empleadoAsignado?.nombre_usuario ?? "").toLowerCase();
      const id = `ASG-${s.id_asignacion}`.toLowerCase();
      const desc = (s.descripcion ?? "").toLowerCase();

      const hayTodos = tokens.every(t =>
        id.includes(t) || empleado.includes(t) || desc.includes(t)
      );
      return hayTodos;
    });
  }, [servicios, desde, hasta, estadoFiltro, tokens]);

  // KPIs
  const stats = useMemo(() => {
    const total = filtrados.length;
    const porEstado = ESTADOS.reduce((acc, est) => {
      acc[est] = filtrados.filter(s => normEstado(s.estado) === est).length;
      return acc;
    }, {});
    return { total, porEstado };
  }, [filtrados]);

  // Gráficas
  const barData = useMemo(() => [{
    name: "Asignaciones",
    ...ESTADOS.reduce((acc, est) => {
      acc[est] = stats.porEstado?.[est] ?? 0;
      return acc;
    }, {})
  }], [stats]);

  const pieData = useMemo(() =>
    ESTADOS.map(est => ({
      name: humanEstado(est),
      value: stats.porEstado?.[est] ?? 0,
      color: statusColor[est]
    })).filter(d => d.value > 0)
  , [stats]);

  const serieTemporal = useMemo(() => {
    const byDate = {};
    filtrados.forEach(s => {
      const d = fmtFecha(s.fecha_asignacion);
      if (!byDate[d]) {
        byDate[d] = { date: d };
        ESTADOS.forEach(est => { byDate[d][est] = 0; });
      }
      const est = normEstado(s.estado);
      if (ESTADOS.includes(est)) byDate[d][est] += 1;
    });
    const arr = Object.values(byDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return arr.slice(-30);
  }, [filtrados]);

  // Tabla de recientes
  const recientes = useMemo(() => {
    return [...filtrados]
      .sort((a, b) => {
        const da = new Date(a.fecha_asignacion || 0).getTime();
        const db = new Date(b.fecha_asignacion || 0).getTime();
        return db - da;
      })
      .slice(0, 15);
  }, [filtrados]);

  // CSV Export
  const exportarCSV = () => {
    const headers = ["ID_Asignacion","Empleado","Descripcion","Estado","Fecha_Asignacion"];
    const rows = filtrados.map((s) => [
      `ASG-${s.id_asignacion}`,
      s.usuarioEmpleado?.nombre_usuario ?? s.empleadoAsignado?.nombre_usuario ?? "N/D",
      (s.descripcion ?? "").replaceAll("\n", " ").replaceAll(";", ","),
      normEstado(s.estado),
      fmtFecha(s.fecha_asignacion),
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `reporte-asignaciones-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-page">
      <div className="card-head">
        <h2 className="card-title">Reportes — Resumen personal</h2>

        {/* Filtros + Buscador mejorado */}
        <div className="filters" style={{ gap: 12, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <div className="search" style={{ minWidth: 260 }}>
            <i className="bi bi-search" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (ID, empleado, descripción)"
              aria-label="Buscar asignaciones"
            />
            {q && (
              <button
                className="icon-btn"
                onClick={() => setQ("")}
                title="Limpiar búsqueda"
                style={{ width: 36, height: 30 }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="field">
            <label className="muted" style={{ fontSize: 12 }}>Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted" style={{ fontSize: 12 }}>Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted" style={{ fontSize: 12 }}>Estado</label>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="select">
              <option value="todos">Todos</option>
              {ESTADOS.map((est) => (
                <option key={est} value={est}>{humanEstado(est)}</option>
              ))}
            </select>
          </div>

          <button className="btn" onClick={exportarCSV}>Exportar CSV</button>
        </div>
      </div>

      {/* Línea de feedback del buscador */}
      {(debouncedQ || estadoFiltro !== "todos" || desde || hasta) && (
        <div className="muted" style={{ marginBottom: 8, opacity: .9 }}>
          {stats.total} resultado(s)
          {debouncedQ && <> · búsqueda: <b>"{debouncedQ}"</b></>}
          {estadoFiltro !== "todos" && <> · estado: <b>{humanEstado(estadoFiltro)}</b></>}
          {(desde || hasta) && <> · rango: <b>{desde || "—"} → {hasta || "—"}</b></>}
        </div>
      )}

      {loading && <p>Cargando reportes…</p>}
      {err && <p className="error">{err}</p>}

      {!loading && !err && (
        <div className="report-scroll">
          {/* KPIs */}
          <div className="kpi-grid" style={{ marginTop: 12 }}>
            <div className="kpi">
              <div className="kpi-label">Total filtrado</div>
              <div className="kpi-value">{stats.total}</div>
            </div>
            {ESTADOS.map((est) => (
              <div className="kpi" key={est}>
                <div className="kpi-label" style={{ textTransform: "capitalize" }}>
                  {humanEstado(est)}
                </div>
                <div className="kpi-value">{stats.porEstado?.[est] ?? 0}</div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div className="charts-grid" style={{ marginTop: 16 }}>
            {/* Barra apilada por estado */}
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Conteo por estado</h3>
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {ESTADOS.map(est => (
                      <Bar key={est} dataKey={est} stackId="a" fill={statusColor[est]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie participación por estado */}
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Participación por estado</h3>
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Serie temporal (área apilada por estado) */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <h3 className="card-title">Tendencia por día</h3>
            </div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieTemporal} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <defs>
                    {ESTADOS.map((est) => (
                      <linearGradient id={`grad-${est}`} key={est} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={statusColor[est]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={statusColor[est]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {ESTADOS.map(est => (
                    <Area
                      key={est}
                      type="monotone"
                      dataKey={est}
                      stackId="1"
                      stroke={statusColor[est]}
                      fillOpacity={1}
                      fill={`url(#grad-${est})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla */}
          <div className="table-viewport" style={{ marginTop: 16 }}>
            <div className="table-wrap">
              <div className="card-head" style={{ paddingLeft: 12, paddingRight: 12 }}>
                <h3 className="card-title">Asignaciones recientes (filtradas)</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empleado</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Fecha asignación</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((s) => {
                    const e = normEstado(s.estado);
                    const empleado = s.usuarioEmpleado?.nombre_usuario ?? s.empleadoAsignado?.nombre_usuario ?? "N/D";
                    const idText = `ASG-${s.id_asignacion}`;
                    return (
                      <tr key={s.id_asignacion}>
                        <td className="mono">{highlight(idText, tokens)}</td>
                        <td>{highlight(empleado, tokens)}</td>
                        <td className="muted">{highlight(s.descripcion ?? "—", tokens)}</td>
                        <td>
                          <span style={{
                            color: "#fff",
                            background: statusColor[e] || "#6b7280",
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 12,
                            textTransform: "capitalize",
                            whiteSpace: "nowrap",
                          }}>
                            {humanEstado(e)}
                          </span>
                        </td>
                        <td>{fmtFecha(s.fecha_asignacion)}</td>
                      </tr>
                    );
                  })}
                  {recientes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty">Sin resultados con los filtros actuales.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="fineprint">*Datos en tiempo real desde /api/empleados/asignaciones/:id_usuario.</p>
        </div>
      )}
    </div>
  );
}
