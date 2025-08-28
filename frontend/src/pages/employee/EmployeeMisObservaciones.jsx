// /employee/EmployeeMisObservaciones.jsx
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

export default function EmployeeMisObservaciones() {
  const [data, setData] = useState([]);    // asignaciones con observaciones
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(() => new Set()); // acordeón abierto por id_asignacion

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await axios.get("/api/empleados/observacionesPorUsuario");
        setData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar tus observaciones.");
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
        ...(asg.ObservacionesProcesoTrabajos ?? []).map((o) => o.observacion),
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
        <h2 className="card-title">Mis observaciones</h2>
        <div className="filters" style={{ gap: 8 }}>
          <div className="search">
            <i className="bi bi-search" />
            <input
              placeholder="Buscar (ID, descripción, observación)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar observaciones"
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
            const obsOrdenadas = [...(asg.ObservacionesProcesoTrabajos ?? [])].sort(
              (a, b) => new Date(b.fecha_observacion || 0) - new Date(a.fecha_observacion || 0)
            );
            const isOpen = expanded.has(asg.id_asignacion);

            return (
              <article className="asg-card" key={asg.id_asignacion}>
                {/* Header tarjeta (acordeón) */}
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
                      title={isOpen ? "Ocultar observaciones" : "Ver observaciones"}
                    >
                      <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} />
                      {isOpen ? "Ocultar" : `Ver (${obsOrdenadas.length})`}
                    </button>
                  </div>
                </header>

                {/* Descripción de la asignación */}
                <p className="asg-desc">{asg.descripcion || "—"}</p>

                {/* Panel de observaciones (timeline + cards) */}
                {isOpen && (
                  <section
                    id={`panel-${asg.id_asignacion}`}
                    className="avance-list"
                    aria-live="polite"
                  >
                    {obsOrdenadas.length ? (
                      obsOrdenadas.map((o, idx) => (
                        <div className="avance-card" key={o.id_observacion}>
                          <div className="avance-line">
                            <div className="dot" aria-hidden />
                            {idx < obsOrdenadas.length - 1 && <span className="line" aria-hidden />}
                          </div>

                          <div className="avance-body">
                            <div className="avance-head">
                              <strong className="avance-title">Obs #{o.id_observacion}</strong>
                              <span className="avance-date">{fmtFecha(o.fecha_observacion)}</span>
                            </div>

                            <p className="avance-desc">{o.observacion || "—"}</p>

                            <div className="avance-foot">
                              <span className="tag muted">Asignación: ASG-{asg.id_asignacion}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty muted">Sin observaciones registradas.</div>
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
