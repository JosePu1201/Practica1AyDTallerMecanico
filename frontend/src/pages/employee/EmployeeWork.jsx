// /employee/EmployeeWork.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EmployeeWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tareas, setTareas] = useState(fallback);
  const [nota, setNota] = useState("");
  const [tiempo, setTiempo] = useState(0);
  const [estado, setEstado] = useState("en_progreso");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Cargar tarea específica si ya tienes API:
    // axios.get(`/api/empleado/servicios/${id}`)
    //   .then(r => setTareas([r.data]))
    //   .catch(() => setTareas(fallback));
  }, [id]);

  const tarea = useMemo(() => tareas.find(s => s.id === id), [tareas, id]);

  const guardarAvance = async (finalizar=false) => {
    setSubmitting(true);
    try {
      const payload = { nota, tiempo: Number(tiempo)||0, estado: finalizar ? "completado" : estado };
      // await axios.post(`/api/empleado/servicios/${id}/avance`, payload);

      setNota(""); setTiempo(0);
      if (finalizar) { alert("Tarea finalizada."); navigate("/employee/tasks", { replace:true }); }
      else { alert("Avance registrado."); }
    } catch (e) {
      console.error(e); alert("No se pudo guardar el avance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tarea) {
    return (
      <>
        <div className="card-head"><h2 className="card-title">Trabajar en tarea</h2></div>
        <p className="empty">No se encontró el trabajo <strong>{id}</strong>.</p>
        <button className="btn" onClick={()=>navigate("/employee/tasks")}>Volver</button>
      </>
    );
  }

  return (
    <>
      <div className="card-head">
        <h2 className="card-title">Trabajar en: {tarea.id}</h2>
      </div>

      <div className="work-header">
        <div><div className="label">Cliente</div><div className="value">{tarea.cliente}</div></div>
        <div><div className="label">Descripción</div><div className="value">{tarea.descripcion}</div></div>
        <div><div className="label">Estado actual</div><span className={badgeTone[tarea.estado]}>{tarea.estado.replace("_"," ")}</span></div>
        <div><div className="label">Fecha</div><div className="value">{tarea.fecha}</div></div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label>Estado de la tarea</label>
          <select value={estado} onChange={(e)=>setEstado(e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completado">Completado</option>
          </select>
        </div>

        <div className="form-field">
          <label>Tiempo invertido (minutos)</label>
          <input type="number" min="0" value={tiempo} onChange={(e)=>setTiempo(e.target.value)} placeholder="0" />
        </div>

        <div className="form-field col-span-2">
          <label>Notas / Avance</label>
          <textarea rows={5} value={nota} onChange={(e)=>setNota(e.target.value)} placeholder="Describe el avance..." />
        </div>
      </div>

      <div className="actions-end">
        <button className="btn-ghost" onClick={()=>guardarAvance(false)} disabled={submitting}>Guardar avance</button>
        <button className="btn" onClick={()=>guardarAvance(true)} disabled={submitting}>Finalizar tarea</button>
        <button className="btn-ghost" onClick={()=>navigate("/employee/tasks")}>Volver</button>
      </div>

      <p className="fineprint">
        *Conecta tus endpoints: <code>POST /api/empleado/servicios/:id/avance</code> y/o <code>PATCH /api/empleado/servicios/:id</code>.
      </p>
    </>
  );
}
