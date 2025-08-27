import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';
import '../styles/specialist.css';

export default function WorksList() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchWorks = async () => {
      if (!user || !user.id_usuario) {
        return;
      }

      try {
        setLoading(true);
        const data = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        setWorks(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los trabajos asignados: ' + err.message);
        setLoading(false);
      }
    };

    fetchWorks();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
      case 'ASIGNADO':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter works based on search term and status filter
  const filteredWorks = works.filter(work => {
    const matchesSearch = 
      work.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.TipoMantenimiento?.nombre_tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.RegistroServicioVehiculo?.Vehiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? work.estado === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando trabajos asignados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Trabajos Asignados</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row gap-3 mb-3 justify-content-between">
            <Form.Group className="flex-grow-1">
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar trabajos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group style={{ minWidth: '200px' }}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ASIGNADO">Asignado</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADO">Completado</option>
              </Form.Select>
            </Form.Group>
          </div>
          
          {filteredWorks.length === 0 ? (
            <div className="text-center my-5">
              <i className="bi bi-clipboard-x display-4 text-muted"></i>
              <p className="mt-3">No se encontraron trabajos que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Tipo de Trabajo</th>
                    <th>Descripción</th>
                    <th>Fecha Asignación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorks.map(work => (
                    <tr key={work.id_asignacion}>
                      <td>{work.id_asignacion}</td>
                      <td>
                        <div>
                          {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                          <div className="small text-muted">
                            {work.RegistroServicioVehiculo?.Vehiculo?.placa}
                          </div>
                        </div>
                      </td>
                      <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {work.descripcion}
                        </div>
                      </td>
                      <td>{formatDate(work.fecha_asignacion)}</td>
                      <td>{getStatusBadge(work.estado)}</td>
                      <td>
                        <Link to={`/specialist/works/${work.id_asignacion}`} className="btn btn-sm btn-outline-primary me-2">
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Button 
                          variant={work.estado === 'COMPLETADO' ? 'outline-success' : 'outline-primary'}
                          size="sm"
                          disabled={work.estado === 'COMPLETADO'}
                        >
                          <i className={work.estado === 'COMPLETADO' ? 'bi bi-check-circle' : 'bi bi-play-circle'}></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
