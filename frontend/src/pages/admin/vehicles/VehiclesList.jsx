import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Spinner, Form, InputGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function VehiclesList({ initialData }) {
  const [allVehicles, setAllVehicles] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ← id que se está eliminando

  const normalizedInitial = useMemo(() => {
    if (!initialData) return null;
    return Array.isArray(initialData) ? initialData : (initialData.vehiculos || []);
  }, [initialData]);

  useEffect(() => {
    const loadOnce = async () => {
      try {
        setLoading(true);
        let base = normalizedInitial;
        if (!base) {
          const res = await axios.get('/api/vehiculos/listar');
          base = Array.isArray(res.data) ? res.data : (res.data?.vehiculos || []);
        }
        setAllVehicles(base);
        setVehicles(base);
        setError(null);
      } catch (err) {
        const msg = err.response?.data?.error || err.message;
        setError('Error al cargar vehículos: ' + msg);
        toast.error('No se pudieron cargar los vehículos');
      } finally {
        setLoading(false);
      }
    };
    loadOnce();
  }, [normalizedInitial]);

  // Filtro en memoria
  const applyFilter = (term) => {
    const t = term.trim().toLowerCase();
    if (!t) {
      setVehicles(allVehicles);
      return;
    }
    const filtered = allVehicles.filter(v => {
      const placa  = (v.placa  || '').toLowerCase();
      const marca  = (v.marca  || '').toLowerCase();
      const modelo = (v.modelo || '').toLowerCase();
      const user = (v.id_cliente||'').toLowerCase();
      return placa.includes(t) || marca.includes(t) || modelo.includes(t)||user.includes(t);
    });
    setVehicles(filtered);
  };

  // Filtro en cada tecla
  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    applyFilter(val);
  };

  // Eliminar vehículo (PUT /api/vehiculos/eliminar/:id)
  const handleDelete = async (veh) => {
    const { id_vehiculo, placa } = veh;
    const ok = window.confirm(`¿Eliminar el vehículo ${placa || '#'+id_vehiculo}?`);
    if (!ok) return;

    try {
      setDeletingId(id_vehiculo);
      const res = await axios.put(`/api/vehiculos/eliminar/${id_vehiculo}`);

      const msg = res.data?.message || 'Vehículo eliminado';
      toast.success(msg);

      // Quitar de las listas en memoria
      setAllVehicles(prev => prev.filter(x => x.id_vehiculo !== id_vehiculo));
      setVehicles(prev => prev.filter(x => x.id_vehiculo !== id_vehiculo));
    } catch (err) {
      const apiErr = err.response?.data?.error || err.message;

      if (apiErr?.toLowerCase().includes('ya está eliminado')) {
        toast.info('El vehículo ya estaba eliminado');
        // Aun así, sácalo de la tabla para reflejar el estado
        setAllVehicles(prev => prev.filter(x => x.id_vehiculo !== id_vehiculo));
        setVehicles(prev => prev.filter(x => x.id_vehiculo !== id_vehiculo));
      } else {
        toast.error('No se pudo eliminar el vehículo: ' + apiErr);
      }
    } finally {
      setDeletingId(null);
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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Vehículos</h1>
        <div>
          <Link to="/admin/vehicles/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-1" /> Nuevo Vehículo
          </Link>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Form className="mb-3">
            <InputGroup>
              <Form.Control
                placeholder="Buscar por placa, marca o modelo..."
                value={q}
                onChange={handleChange}
              />
              {!!q && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => {
                    setQ('');
                    setVehicles(allVehicles);
                  }}
                >
                  <i className="bi bi-x-circle" /> Limpiar
                </Button>
              )}
            </InputGroup>
          </Form>

          <Table hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Placa</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Kilometraje</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center">No hay vehículos registrados</td>
                </tr>
              ) : vehicles.map(v => (
                <tr key={v.id_vehiculo}>
                  <td>{v.id_vehiculo}</td>
                  <td><Badge bg="dark">{v.placa}</Badge></td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.anio || '-'}</td>
                  <td>{v.color || '-'}</td>
                  <td>{Number(v.kilometraje || 0).toLocaleString()}</td>
                  <td>{v.id_cliente}</td>
                  <td>
                    <Badge bg={v.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                      {v.estado || 'ACTIVO'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Link
                        to={`/admin/vehicles/${v.id_vehiculo}/history`}
                        className="btn btn-outline-secondary"
                        title="Historial de servicios"
                      >
                        <i className="bi bi-clock-history" />
                      </Link>
                      <Link
                        to={`/admin/vehicles/${v.id_vehiculo}/edit`}
                        state={{ vehicle: v }}
                        className="btn btn-outline-primary"
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square" />
                      </Link>
                      <Button
                        type="button"
                        variant="outline-danger"
                        title="Eliminar"
                        onClick={() => handleDelete(v)}
                        disabled={deletingId === v.id_vehiculo}
                      >
                        {deletingId === v.id_vehiculo
                          ? <i className="bi bi-hourglass-split" />
                          : <i className="bi bi-trash" />
                        }
                      </Button>
                    </div>
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
