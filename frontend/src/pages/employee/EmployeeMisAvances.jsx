// /employee/EmployeeMisAvances.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const normEstado = (e) => (e ?? "").toString().trim().toUpperCase();
const humanEstado = (e) => (e ? e.replaceAll("_", " ").toLowerCase() : "—");
const fmtFecha = (f) => {
  if (!f) return "—";
  try {
    const d = new Date(f);
    return isNaN(d.getTime()) ? "—" : d.toISOString().split("T")[0];
  } catch { return "—"; }
};

const badgeTone = {
  ASIGNADO: "badge badge-warn",
  EN_PROCESO: "badge badge-info",
  COMPLETADO: "badge badge-ok",
  PAUSADO: "badge badge-neutral",
  CANCELADO: "badge badge-error",
};

// progreso general: último avance por fecha, o 100% si está COMPLETADO, o 0%
const overallProgress = (asg) => {
  const e = normEstado(asg.estado);
  if (e === "COMPLETADO") return 100;
  const arr = Array.isArray(asg.AvancesTrabajos) ? [...asg.AvancesTrabajos] : [];
  if (!arr.length) return 0;
  arr.sort((a, b) => new Date(b.fecha_avance || 0) - new Date(a.fecha_avance || 0));
  return Number(arr[0]?.porcentaje ?? 0);
};

export default function EmployeeMisAvances() {
  const [data, setData] = useState([]);     // asignaciones
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(() => new Set()); // acordeón abierto por id_asignacion

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await axios.get("/api/empleados/avancesPorUsuario");
        setData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar tus avances.");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const filtradas = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return data;
    return data.filter((asg) => {
      const hay = [
        `ASG-${asg.id_asignacion}`,
        asg.descripcion ?? "",
        normEstado(asg.estado),
        ...(asg.AvancesTrabajos ?? []).map((a) => `${a.nombre} ${a.descripcion}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [data, q]);

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="report-page">
      <div className="card-head">
        <h2 className="card-title">Mis avances</h2>
        <div className="filters" style={{ gap: 8 }}>
          <div className="search">
            <i className="bi bi-search" />
            <input
              placeholder="Buscar (ID, descripción, avance)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar avances"
            />
            {q && (
              <button className="icon-btn" onClick={() => setQ("")} title="Limpiar">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && <p>Cargando…</p>}
      {err && <p className="error">{err}</p>}

      {!loading && !err && (
        <div className="asg-grid">
          {filtradas.map((asg) => {
            const e = normEstado(asg.estado);
            const cls = badgeTone[e] || "badge";
            const avancesOrdenados = [...(asg.AvancesTrabajos ?? [])].sort(
              (a, b) => new Date(b.fecha_avance || 0) - new Date(a.fecha_avance || 0)
            );
            const prog = overallProgress(asg);
            const isOpen = expanded.has(asg.id_asignacion);

            return (
              <article className="asg-card" key={asg.id_asignacion}>
                {/* Header card */}
                <header className="asg-card-head" onClick={() => toggleExpand(asg.id_asignacion)}>
                  <div className="asg-title">
                    <span className="asg-id">ASG-{asg.id_asignacion}</span>
                    <span className={cls} style={{ textTransform: "capitalize" }}>
                      {humanEstado(e)}
                    </span>
                  </div>
                  <div className="asg-meta">
                    <span className="asg-date">{fmtFecha(asg.fecha_asignacion)}</span>
                    <button
                      className="chip ghost"
                      aria-expanded={isOpen}
                      aria-controls={`panel-${asg.id_asignacion}`}
                      title={isOpen ? "Ocultar avances" : "Ver avances"}
                    >
                      <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} />
                      {isOpen ? "Ocultar" : `Ver (${avancesOrdenados.length})`}
                    </button>
                  </div>
                </header>

                {/* Descripción */}
                <p className="asg-desc">{asg.descripcion || "—"}</p>

                {/* Progreso general */}
                <div className="progress-wrap" title={`Progreso general: ${prog}%`}>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${prog}%` }} />
                  </div>
                  <span className="progress-label">{prog}%</span>
                </div>

                {/* Panel avances */}
                {isOpen && (
                  <section
                    id={`panel-${asg.id_asignacion}`}
                    className="avance-list"
                    aria-live="polite"
                  >
                    {avancesOrdenados.length ? (
                      avancesOrdenados.map((av, idx) => (
                        <div className="avance-card" key={av.id_avance}>
                          <div className="avance-line">
                            <div className="dot" aria-hidden />
                            {idx < avancesOrdenados.length - 1 && <span className="line" aria-hidden />}
                          </div>

                          <div className="avance-body">
                            <div className="avance-head">
                              <strong className="avance-title">
                                {av.nombre || `Avance #${av.id_avance}`}
                              </strong>
                              <span className="avance-date">{fmtFecha(av.fecha_avance)}</span>
                            </div>

                            <p className="avance-desc">{av.descripcion || "—"}</p>

                            <div className="progress tiny">
                              <div
                                className="progress-bar"
                                style={{ width: `${av.porcentaje ?? 0}%` }}
                              />
                            </div>
                            <div className="avance-foot">
                              <span className="tag">Progreso: {av.porcentaje ?? 0}%</span>
                              <span className="tag muted">ID: {av.id_avance}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty muted">Sin avances registrados.</div>
                    )}
                  </section>
                )}
              </article>
            );
          })}

          {filtradas.length === 0 && (
            <div className="empty muted" style={{ gridColumn: "1 / -1" }}>
              No hay resultados con el término de búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
