// /employee/EmployeeTasks.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const badgeTone = {
  ASIGNADO: "badge badge-warn",
  EN_PROCESO: "badge badge-info",
  COMPLETADO: "badge badge-ok",
  PAUSADO: "badge badge-neutral",
  CANCELADO: "badge badge-error",
};

const normEstado = (e) => (e ?? "").trim().toUpperCase();
const humanEstado = (e) => (e ? e.replaceAll("_", " ").toLowerCase() : "—");
const fmtFecha = (f) => {
  if (!f) return "—";
  try {
    const d = new Date(f);
    return isNaN(d.getTime()) ? "—" : d.toISOString().split("T")[0];
  } catch { return "—"; }
};

export default function EmployeeTasks() {
  const [servicios, setServicios] = useState([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");

  // Dropdown state
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuDropUp, setMenuDropUp] = useState(false);

  // Modales
  const [modal, setModal] = useState({ open: false, type: null, asgId: null });
  const [loading, setLoading] = useState(false);

  // Avances / Observaciones
  const [avances, setAvances] = useState([]);
  const [observaciones, setObservaciones] = useState([]);

  // Forms
  const [avanceForm, setAvanceForm] = useState({ descripcion: "", nombre: "", porcentaje: 0 });
  const [obsForm, setObsForm] = useState({ observacion: "" });
  const [impForm, setImpForm] = useState({ descripcion_imprevisto: "", impacto_tiempo: 0, impacto_costo: 0 });
  const [danioForm, setDanioForm] = useState({ descripcion_danio: "", costo_estimado: 0, requiere_autorizacion: false });
  const [repForm, setRepForm] = useState({ descripcion: "", cantidad: 1, id_inventario_repuesto: "" });

  // Apoyo especialista
  const [especialistas, setEspecialistas] = useState([]);
  const [apoyoForm, setApoyoForm] = useState({ id_usuario_especialista: "", descripcion_apoyo: "" });

  // Busy (acciones de estado)
  const [busy, setBusy] = useState({ id: null, action: null });

  const navigate = useNavigate();

  // array de repuestos
  const [repuestos, setRepuestos] = useState([]);

  // === NUEVO: alertas de stock bajo ===
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      let user = null;
      try {
        const raw = localStorage.getItem("user");
        user = raw ? JSON.parse(raw) : null;
      } catch {
        console.warn("JSON inválido en localStorage.user");
      }

      if (!user?.id_usuario) {
        console.warn("No hay user o id_usuario en localStorage");
        setServicios([]);
        return;
      }

      try {
        // Asignaciones
        const res = await axios.get(`/api/empleados/asignaciones/${user.id_usuario}`);
        const data = res?.data ?? [];
        setServicios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando asignaciones", err);
        setServicios([]);
      }

      try {
        const repRes = await axios.get(`/api/inventario/repuestos`);
        setRepuestos(Array.isArray(repRes.data) ? repRes.data : []);
      } catch (err) {
        console.error("Error cargando repuestos", err);
        setRepuestos([]);
      }
    };

    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const term = q.toLowerCase().trim();
    return servicios.filter((s) => {
      const txt = [
        `ASG-${s.id_asignacion}`,
        (s.usuarioEmpleado?.nombre_usuario ?? s.empleadoAsignado?.nombre_usuario ?? ""),
        s.descripcion ?? "",
      ].join(" ").toLowerCase();

      const estadoNorm = normEstado(s.estado);
      const coincideTexto = !term || txt.includes(term);
      const coincideEstado = filtro === "todos" || estadoNorm === filtro;
      return coincideTexto && coincideEstado;
    });
  }, [servicios, q, filtro]);

  const actualizarLocal = (id_asignacion, estado) =>
    setServicios((prev) =>
      prev.map((s) => (s.id_asignacion === id_asignacion ? { ...s, estado } : s))
    );

  // ===== Acciones de estado (con endpoints específicos) =====
  const actualizarEstadoRemoto = async (id_asignacion, action, nuevoEstado, url) => {
    try {
      setBusy({ id: id_asignacion, action });
      // Ajusta método/URL/payload si tu backend difiere:
      await axios.put(`/api/empleados/actualizar_estado`, {id_asingnacion:id_asignacion, estado:nuevoEstado});
      actualizarLocal(id_asignacion, nuevoEstado);
    } catch (e) {
      console.error(`Error en acción ${action} para ${id_asignacion}`, e);
    } finally {
      setBusy({ id: null, action: null });
    }
  };

  const completar = (id) => actualizarEstadoRemoto(id, "completar", "COMPLETADO", "completar");
  const pausar    = (id) => actualizarEstadoRemoto(id, "pausar",    "PAUSADO",    "pausar");
  const cancelar  = (id) => actualizarEstadoRemoto(id, "cancelar",  "CANCELADO",  "cancelar");
  const reanudar  = (id) => actualizarEstadoRemoto(id, "reanudar",  "EN_PROCESO", "reanudar");

  const confirmarCancelar = (id) => {
    const ok = window.confirm("¿Seguro que deseas cancelar esta asignación? Esta acción no se puede deshacer.");
    if (ok) cancelar(id);
  };

  // ===== Avances =====
  const abrirVerAvances = async (asgId) => {
    setMenuOpenId(null);
    setModal({ open: true, type: "ver-avances", asgId });
    setLoading(true);
    try {
      const res = await axios.get(`/api/empleados/avances/${asgId}`);
      setAvances(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error obteniendo avances", e);
      setAvances([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirRegistrarAvance = (asgId) => {
    setMenuOpenId(null);
    setAvanceForm({ descripcion: "", nombre: "", porcentaje: 0 });
    setModal({ open: true, type: "registrar-avance", asgId });
  };

  const submitRegistrarAvance = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asingnacion: String(modal.asgId), // (sic) tal cual backend
        descripcion: avanceForm.descripcion,
        nombre: avanceForm.nombre,
        porcentaje: Number(avanceForm.porcentaje),
      };
      await axios.post(`/api/empleados/avance`, payload);
      const est = avanceForm.porcentaje==100? "COMPLETADO":"EN_PROCESO";
      actualizarLocal(modal.asgId, est);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error registrando avance", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Observaciones =====
  const abrirObservacion = (asgId) => {
    setMenuOpenId(null);
    setObsForm({ observacion: "" });
    setModal({ open: true, type: "observacion", asgId });
  };

  const abrirVerObservaciones = async (asgId) => {
    setMenuOpenId(null);
    setModal({ open: true, type: "ver-observaciones", asgId });
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/empleados/observacionesPorAsignacion/${asgId}`);
      setObservaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error obteniendo observaciones", e);
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const submitObservacion = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asignacion: String(modal.asgId),
        observacion: obsForm.observacion,
      };
      await axios.post(`/api/empleados/observacion`, payload);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error registrando observación", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Imprevisto =====
  const abrirImprevisto = (asgId) => {
    setMenuOpenId(null);
    setImpForm({ descripcion_imprevisto: "", impacto_tiempo: 0, impacto_costo: 0 });
    setModal({ open: true, type: "imprevisto", asgId });
  };

  const submitImprevisto = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asignacion_trabajo: Number(modal.asgId),
        descripcion_imprevisto: impForm.descripcion_imprevisto,
        impacto_tiempo: Number(impForm.impacto_tiempo),
        impacto_costo: Number(impForm.impacto_costo),
      };
      await axios.post(`/api/empleados/imprevisto`, payload);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error registrando imprevisto", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Daño adicional =====
  const abrirDanio = (asgId) => {
    setMenuOpenId(null);
    setDanioForm({ descripcion_danio: "", costo_estimado: 0, requiere_autorizacion: false });
    setModal({ open: true, type: "danio", asgId });
  };

  const submitDanio = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asignacion_trabajo: Number(modal.asgId),
        descripcion_danio: danioForm.descripcion_danio,
        costo_estimado: Number(danioForm.costo_estimado),
        requiere_autorizacion: Boolean(danioForm.requiere_autorizacion),
      };
      await axios.post(`/api/empleados/danioAdicional`, payload);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error registrando daño adicional", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Solicitud repuesto =====
  const abrirRepuesto = (asgId) => {
    setMenuOpenId(null);
    setRepForm({ descripcion: "", cantidad: 1, id_inventario_repuesto: "" });
    setModal({ open: true, type: "repuesto", asgId });
  };

  const submitRepuesto = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asignacion_trabajo: Number(modal.asgId),
        descripcion: repForm.descripcion,
        cantidad: Number(repForm.cantidad),
        id_inventario_repuesto: Number(repForm.id_inventario_repuesto),
      };
      await axios.post(`/api/empleados/solicitudUsoRepuesto`, payload);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error registrando solicitud de repuesto", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Apoyo a especialista =====
  const abrirApoyo = async (asgId) => {
    setMenuOpenId(null);
    setApoyoForm({ id_usuario_especialista: "", descripcion_apoyo: "" });
    setModal({ open: true, type: "apoyo", asgId });
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/management/users`);
      const lista = Array.isArray(data) ? data : [];
      const specs = lista.filter(u =>
        (u?.Rol?.nombre_rol ?? "").toUpperCase() === "ESPECIALISTA"
      );
      setEspecialistas(specs);
    } catch (e) {
      console.error("Error cargando especialistas", e);
      setEspecialistas([]);
    } finally {
      setLoading(false);
    }
  };

  const submitApoyo = async () => {
    setLoading(true);
    try {
      const payload = {
        id_asignacion_trabajo: Number(modal.asgId),
        id_usuario_especialista: Number(apoyoForm.id_usuario_especialista),
        descripcion_apoyo: apoyoForm.descripcion_apoyo,
      };
      await axios.post(`/api/empleados/solicitudApoyoEspecialista`, payload);
      setModal({ open: false, type: null, asgId: null });
    } catch (e) {
      console.error("Error solicitando apoyo", e);
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = () => setModal({ open: false, type: null, asgId: null });

  // Manejo de apertura de menú: calcula si no hay espacio abajo
  const toggleMenu = (asgId, evt) => {
    const isOpen = menuOpenId === asgId;
    if (isOpen) { setMenuOpenId(null); return; }
    const rect = evt.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceNeeded = 260; // aprox alto del menú
    setMenuDropUp(spaceBelow < spaceNeeded);
    setMenuOpenId(asgId);
  };

  // ===== NUEVO: abrir alerta de inventario bajo =====
  const abrirAlertaStock = async () => {
    setModal({ open: true, type: "alerta-stock", asgId: null });
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/inventario/alertaInventarioBajo`);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setLowStock(list);
    } catch (e) {
      console.error("Error consultando alerta de stock", e);
      setLowStock([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card-head" style={{ color: '#000' }}>
        <h2 className="card-title">Trabajos asignados</h2>

        {/* NUEVO: Botón de alerta bajo stock */}
        <button
          className="btn"
          onClick={abrirAlertaStock}
          title="Ver alerta de inventario bajo"
          style={{ marginRight: 8 }}
        >
          <i className="bi bi-exclamation-triangle me-2" />
          Alerta bajo stock
        </button>

        <div className="filters">
          <div className="search">
            <i className="bi bi-search" />
            <input
              placeholder="Buscar (ID, cliente, descripción)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="ASIGNADO">Asignados</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="PAUSADO">Pausados</option>
            <option value="COMPLETADO">Completados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha asignación</th>
              <th style={{width: 600}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((s) => {
              const e = normEstado(s.estado);
              const cls = badgeTone[e] || "badge";
              const open = menuOpenId === s.id_asignacion;

              const nombreEmpleado =
                s.usuarioEmpleado?.nombre_usuario ??
                s.empleadoAsignado?.nombre_usuario ??
                "N/D";

              const isBusy = (a) => busy.id === s.id_asignacion && busy.action === a;

              return (
                <tr key={s.id_asignacion}>
                  <td className="mono">{`ASG-${s.id_asignacion}`}</td>
                  <td>{nombreEmpleado}</td>
                  <td className="muted">{s.descripcion}</td>
                  <td><span className={cls}>{humanEstado(e)}</span></td>
                  <td>{fmtFecha(s.fecha_asignacion)}</td>
                  <td>
                    <div className="actions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {/* Acciones según estado */}
                      {e === "ASIGNADO" && (
                        <>
                          <button
                            className="btn btn-danger"
                            disabled={isBusy("cancelar")}
                            onClick={() => confirmarCancelar(s.id_asignacion)}
                          >
                            {isBusy("cancelar") ? "Cancelando..." : "Cancelar"}
                          </button>
                          <button
                            className="btn btn-warning"
                            disabled={isBusy("pausar")}
                            onClick={() => pausar(s.id_asignacion)}
                          >
                            {isBusy("pausar") ? "Pausando..." : "Pausar"}
                          </button>
                          <button
                            className="btn btn-success"
                            disabled={isBusy("completar")}
                            onClick={() => completar(s.id_asignacion)}
                          >
                            {isBusy("completar") ? "Guardando..." : "Marcar como completado"}
                          </button>
                        </>
                      )}

                      {e === "EN_PROCESO" && (
                        <>
                          <button
                            className="btn btn-danger"
                            disabled={isBusy("cancelar")}
                            onClick={() => confirmarCancelar(s.id_asignacion)}
                          >
                            {isBusy("cancelar") ? "Cancelando..." : "Cancelar"}
                          </button>
                          <button
                            className="btn btn-warning"
                            disabled={isBusy("pausar")}
                            onClick={() => pausar(s.id_asignacion)}
                          >
                            {isBusy("pausar") ? "Pausando..." : "Pausar"}
                          </button>
                          <button
                            className="btn btn-success"
                            disabled={isBusy("completar")}
                            onClick={() => completar(s.id_asignacion)}
                          >
                            {isBusy("completar") ? "Guardando..." : "Marcar como completado"}
                          </button>
                        </>
                      )}

                      {e === "PAUSADO" && (
                        <>
                          <button
                            className="btn btn-danger"
                            disabled={isBusy("cancelar")}
                            onClick={() => confirmarCancelar(s.id_asignacion)}
                          >
                            {isBusy("cancelar") ? "Cancelando..." : "Cancelar"}
                          </button>
                          <button
                            className="btn btn-primary"
                            disabled={isBusy("reanudar")}
                            onClick={() => reanudar(s.id_asignacion)}
                          >
                            {isBusy("reanudar") ? "Reanudando..." : "Reanudar"}
                          </button>
                        </>
                      )}

                      {e === "CANCELADO" && (
                        <>
                          <button
                            className="btn btn-primary"
                            disabled={isBusy("reanudar")}
                            onClick={() => reanudar(s.id_asignacion)}
                          >
                            {isBusy("reanudar") ? "Reanudando..." : "Reanudar"}
                          </button>
                        </>
                      )}

                      {/* COMPLETADO u otros -> sin botones de estado */}

                      <button
                        className="btn-ghost"
                        onClick={() => abrirVerAvances(s.id_asignacion)}
                      >
                        Ver avances
                      </button>

                      {(e === "ASIGNADO" || e === "EN_PROCESO") ? (
                        // Mostrar menú ⋮ SOLO cuando está ASIGNADO o EN_PROCESO
                        <div className="dropdown" style={{ position: "relative" }}>
                          <button
                            className={open ? "btn-ghost active" : "btn-ghost"}
                            onClick={(evt) => toggleMenu(s.id_asignacion, evt)}
                            aria-haspopup="menu"
                            aria-expanded={open}
                            title="Más acciones"
                          >
                            ⋮
                          </button>
                          {open && (
                            <div
                              className={`action-menu ${menuDropUp ? "drop-up" : ""}`}
                              role="menu"
                              onMouseLeave={() => setMenuOpenId(null)}
                            >
                              <button className="action-menu-item" onClick={() => abrirRegistrarAvance(s.id_asignacion)}>Registrar avance</button>
                              <button className="action-menu-item" onClick={() => abrirObservacion(s.id_asignacion)}>Registrar observación</button>
                              <button className="action-menu-item" onClick={() => abrirVerObservaciones(s.id_asignacion)}>Ver observaciones</button>
                              <button className="action-menu-item" onClick={() => abrirImprevisto(s.id_asignacion)}>Registrar imprevisto</button>
                              <button className="action-menu-item" onClick={() => abrirDanio(s.id_asignacion)}>Registrar daño adicional</button>
                              <button className="action-menu-item" onClick={() => abrirRepuesto(s.id_asignacion)}>Solicitar uso de repuesto</button>
                              <button className="action-menu-item" onClick={() => abrirApoyo(s.id_asignacion)}>Solicitar apoyo a especialista</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Para PAUSADO / CANCELADO / COMPLETADO: NO menú ⋮, mostrar botón "Ver observaciones"
                        <button
                          className="btn-ghost"
                          onClick={() => abrirVerObservaciones(s.id_asignacion)}
                        >
                          Ver observaciones
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="empty">No hay servicios que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      {modal.open && (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains("modal")) cerrarModal(); }}>
          <div className="modal-card">
            {/* Ver avances */}
            {modal.type === "ver-avances" && (
              <>
                <h3>Avances de ASG-{modal.asgId}</h3>
                {loading ? <p>Cargando...</p> : (
                  avances.length ? (
                    <ul className="list">
                      {avances.map(a => (
                        <li key={a.id_avance}>
                          <div className="row">
                            <strong>{a.nombre}</strong> — {a.descripcion}
                          </div>
                          <div className="row">
                            <span>Progreso: {a.porcentaje}%</span>
                            <span className="muted" style={{ marginLeft: 12 }}>
                              {fmtFecha(a.fecha_avance)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="muted">No hay avances registrados.</p>
                )}
                <div className="modal-actions">
                  <button className="btn" onClick={cerrarModal}>Cerrar</button>
                </div>
              </>
            )}

            {/* Ver observaciones */}
            {modal.type === "ver-observaciones" && (
              <>
                <h3>Observaciones — ASG-{modal.asgId}</h3>
                {loading ? <p>Cargando...</p> : (
                  observaciones.length ? (
                    <ul className="list">
                      {observaciones.map(o => (
                        <li key={o.id_observacion}>
                          <div className="row">
                            <strong>Obs #{o.id_observacion}</strong>
                            <span className="muted">{fmtFecha(o.fecha_observacion)}</span>
                          </div>
                          <div style={{ marginTop: 6 }}>{o.observacion}</div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="muted">No hay observaciones registradas.</p>
                )}
                <div className="modal-actions">
                  <button className="btn" onClick={cerrarModal}>Cerrar</button>
                </div>
              </>
            )}

            {/* Registrar avance */}
            {modal.type === "registrar-avance" && (
              <>
                <h3>Registrar avance — ASG-{modal.asgId}</h3>
                <label>Nombre</label>
                <input value={avanceForm.nombre} onChange={e=>setAvanceForm(f=>({...f, nombre:e.target.value}))} />
                <label>Descripción</label>
                <textarea value={avanceForm.descripcion} onChange={e=>setAvanceForm(f=>({...f, descripcion:e.target.value}))} />
                <label>Porcentaje</label>
                <input type="number" min="0" max="100" value={avanceForm.porcentaje} onChange={e=>setAvanceForm(f=>({...f, porcentaje:e.target.value}))} />
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button className="btn" disabled={loading} onClick={submitRegistrarAvance}>Guardar</button>
                </div>
              </>
            )}

            {/* Observación */}
            {modal.type === "observacion" && (
              <>
                <h3>Registrar observación — ASG-{modal.asgId}</h3>
                <label>Observación</label>
                <textarea value={obsForm.observacion} onChange={e=>setObsForm({observacion:e.target.value})} />
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button className="btn" disabled={loading} onClick={submitObservacion}>Guardar</button>
                </div>
              </>
            )}

            {/* Imprevisto */}
            {modal.type === "imprevisto" && (
              <>
                <h3>Registrar imprevisto — ASG-{modal.asgId}</h3>
                <label>Descripción</label>
                <textarea value={impForm.descripcion_imprevisto} onChange={e=>setImpForm(f=>({...f, descripcion_imprevisto:e.target.value}))} />
                <div className="grid2">
                  <div>
                    <label>Impacto tiempo (horas)</label>
                    <input type="number" value={impForm.impacto_tiempo} onChange={e=>setImpForm(f=>({...f, impacto_tiempo:e.target.value}))} />
                  </div>
                  <div>
                    <label>Impacto costo</label>
                    <input type="number" value={impForm.impacto_costo} onChange={e=>setImpForm(f=>({...f, impacto_costo:e.target.value}))} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button className="btn" disabled={loading} onClick={submitImprevisto}>Guardar</button>
                </div>
              </>
            )}

            {/* Daño adicional */}
            {modal.type === "danio" && (
              <>
                <h3>Registrar daño adicional — ASG-{modal.asgId}</h3>
                <label>Descripción del daño</label>
                <textarea value={danioForm.descripcion_danio} onChange={e=>setDanioForm(f=>({...f, descripcion_danio:e.target.value}))} />
                <div className="grid2">
                  <div>
                    <label>Costo estimado</label>
                    <input type="number" value={danioForm.costo_estimado} onChange={e=>setDanioForm(f=>({...f, costo_estimado:e.target.value}))} />
                  </div>
                  <div>
                    <label>
                      <input type="checkbox" checked={danioForm.requiere_autorizacion} onChange={e=>setDanioForm(f=>({...f, requiere_autorizacion:e.target.checked}))} />
                      {" "}Requiere autorización
                    </label>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button className="btn" disabled={loading} onClick={submitDanio}>Guardar</button>
                </div>
              </>
            )}

            {/* Solicitud de repuesto */}
            {modal.type === "repuesto" && (
              <>
                <h3>Solicitud uso de repuesto — ASG-{modal.asgId}</h3>
                <label>Descripción</label>
                <input
                  value={repForm.descripcion}
                  onChange={e=>setRepForm(f=>({...f, descripcion:e.target.value}))}
                />
                <div className="grid2">
                  <div>
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={repForm.cantidad}
                      onChange={e=>setRepForm(f=>({...f, cantidad:e.target.value}))}
                    />
                  </div>
                  <div>
                    <label>Seleccione repuesto</label>
                    <select
                      value={repForm.id_inventario_repuesto}
                      onChange={e=>setRepForm(f=>({...f, id_inventario_repuesto:e.target.value}))}
                    >
                      <option value="">-- Seleccione --</option>
                      {repuestos.map(r => (
                        <option key={r.id_inventario_repuesto} value={r.id_inventario_repuesto}>
                          {r.Repuesto?.nombre} — {r.Repuesto?.descripcion}  
                          (Stock: {r.cantidad}, Precio: Q{r.precio_unitario})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button
                    className="btn"
                    disabled={loading || !repForm.id_inventario_repuesto}
                    onClick={submitRepuesto}
                  >
                    Enviar
                  </button>
                </div>
              </>
            )}

            {/* Apoyo a especialista */}
            {modal.type === "apoyo" && (
              <>
                <h3>Solicitar apoyo a especialista — ASG-{modal.asgId}</h3>
                {loading ? (
                  <p>Cargando especialistas...</p>
                ) : (
                  <>
                    <label>Especialista</label>
                    <select
                      value={apoyoForm.id_usuario_especialista}
                      onChange={e=>setApoyoForm(f=>({...f, id_usuario_especialista:e.target.value}))}
                    >
                      <option value="">Seleccione un especialista</option>
                      {especialistas.map(u => (
                        <option key={u.id_usuario} value={u.id_usuario}>
                          {u.Persona ? `${u.Persona.nombre} ${u.Persona.apellido}` : u.nombre_usuario} (#{u.id_usuario})
                        </option>
                      ))}
                    </select>
                    <label>Descripción del apoyo</label>
                    <textarea
                      value={apoyoForm.descripcion_apoyo}
                      onChange={e=>setApoyoForm(f=>({...f, descripcion_apoyo:e.target.value}))}
                    />
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cerrarModal}>Cancelar</button>
                  <button className="btn" disabled={loading || !apoyoForm.id_usuario_especialista || !apoyoForm.descripcion_apoyo} onClick={submitApoyo}>
                    Enviar solicitud
                  </button>
                </div>
              </>
            )}

            {/* NUEVO: Alerta de stock bajo */}
            {modal.type === "alerta-stock" && (
              <>
                <h3>Alerta de inventario bajo</h3>
                {loading ? (
                  <p>Cargando...</p>
                ) : (
                  <>
                    {(!lowStock || !lowStock.length) ? (
                      <p className="muted">No hay repuestos en bajo stock. Todo en orden ✅</p>
                    ) : (
                      <div className="table-wrap" style={{ marginTop: 8 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th># Inv</th>
                              <th>ID repuesto</th>
                              <th>Nombre</th>
                              <th>Descripción</th>
                              <th>Cantidad</th>
                              <th>Precio unitario</th>
                              <th>Proveedor (NIT)</th>
                              <th>Últ. act.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lowStock.map((it) => {
                              const rep = it?.Repuesto || {};
                              const prov = rep?.Proveedor || {};
                              const precio = Number(it?.precio_unitario ?? 0);
                              const qty = Number(it?.cantidad ?? 0);
                              return (
                                <tr key={it.id_inventario_repuesto ?? `${rep.id_repuesto}-${qty}-${precio}`}>
                                  <td className="mono">{it.id_inventario_repuesto ?? "—"}</td>
                                  <td className="mono">{rep.id_repuesto ?? it.id_repuesto ?? "—"}</td>
                                  <td>{rep.nombre ?? "—"}</td>
                                  <td className="muted">{rep.descripcion ?? "—"}</td>
                                  <td>
                                    <span className="badge badge-error">{qty}</span>
                                  </td>
                                  <td className="mono">Q. {precio.toFixed(2)}</td>
                                  <td className="mono">{prov.nit ?? "—"}</td>
                                  <td className="mono">
                                    {it.fecha_ultima_actualizacion
                                      ? new Date(it.fecha_ultima_actualizacion).toISOString().split("T")[0]
                                      : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="table-tip">
                          <i className="bi bi-info-circle" /> Revisa estos repuestos y genera un pedido al proveedor si corresponde.
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn" onClick={cerrarModal}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <p className="fineprint"></p>
    </>
  );
}
