import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function VehicleHistory() {
  const { id } = useParams();
  const [vehiculo, setVehiculo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const [vRes, hRes] = await Promise.all([
        axios.get(`/api/vehicles/${id}`),
        axios.get(`/api/vehicles/${id}/history`)
      ]);
      setVehiculo(vRes.data);
      setHistorial(hRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial de servicios</h1>
        <div>
          <Link to="/admin/vehicles" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      {vehiculo && (
        <Card className="mb-3">
          <Card.Body className="d-flex flex-wrap gap-4">
            <div>
              <div className="fw-bold">Vehículo</div>
              <div>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `(${vehiculo.anio})` : ''}</div>
            </div>
            <div>
              <div className="fw-bold">Placa</div>
              <div><Badge bg="dark">{vehiculo.placa}</Badge></div>
            </div>
            <div>
              <div className="fw-bold">Cliente</div>
              <div>
                {vehiculo.cliente
                  ? `${vehiculo.cliente?.nombre} ${vehiculo.cliente?.apellido}`
                  : (vehiculo.nombre_cliente || '-')}
              </div>
            </div>
            <div>
              <div className="fw-bold">Estado</div>
              <div>
                <Badge bg={vehiculo.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                  {vehiculo.estado}
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Técnico</th>
                <th>Costo</th>
                <th>Observaciones</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">Sin registros</td>
                </tr>
              ) : historial.map((s, i) => (
                <tr key={s.id_servicio || i}>
                  <td>{new Date(s.fecha).toLocaleString()}</td>
                  <td>{s.nombre_servicio || s.servicio}</td>
                  <td>{s.tecnico ? `${s.tecnico?.nombre} ${s.tecnico?.apellido}` : (s.nombre_tecnico || '-')}</td>
                  <td>{s.costo != null ? Number(s.costo).toLocaleString(undefined, { style: 'currency', currency: 'GTQ' }) : '-'}</td>
                  <td>{s.observaciones || '-'}</td>
                  <td>
                    <Badge bg={s.estado === 'COMPLETADO' ? 'success' : (s.estado === 'PENDIENTE' ? 'warning' : 'secondary')}>
                      {s.estado || '-'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
