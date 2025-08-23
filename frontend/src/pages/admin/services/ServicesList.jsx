import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Form, InputGroup, Spinner, Row, Col, Card, Dropdown } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function ServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await serviceManagementService.getServices();
        setServices(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los servicios');
        setLoading(false);
        console.error('Error loading services:', err);
      }
    };
    
    fetchServices();
  }, []);

  useEffect(() => {
    const statusFilter = searchParams.get('estado');
    let filtered = [...services];
    
    // Apply status filter from URL if present
    if (statusFilter) {
      filtered = filtered.filter(service => service.estado === statusFilter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.Vehiculo?.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.Vehiculo?.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.descripcion_problema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.Vehiculo?.Usuario?.Persona?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.Vehiculo?.Usuario?.Persona?.apellido.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredServices(filtered);
  }, [services, searchTerm, searchParams]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'ALTA':
        return <Badge bg="danger">Alta</Badge>;
      case 'MEDIA':
        return <Badge bg="warning">Media</Badge>;
      case 'BAJA':
        return <Badge bg="info">Baja</Badge>;
      default:
        return <Badge bg="secondary">{priority || 'N/A'}</Badge>;
    }
  };
  
  const handleChangeStatus = async (id, newStatus) => {
    try {
      await serviceManagementService.updateServiceStatus(id, newStatus);
      setServices(services.map(service => 
        service.id_registro === id ? { ...service, estado: newStatus } : service
      ));
    } catch (err) {
      alert(`Error al cambiar el estado: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Servicios de Vehículos</h1>
        <div>
          <Link to="/admin/services/register" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Servicio
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por marca, modelo, cliente o descripción..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    Filtrar por Estado
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSearchParams({})}>Todos</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchParams({ estado: 'PENDIENTE' })}>Pendientes</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchParams({ estado: 'EN_PROCESO' })}>En Proceso</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchParams({ estado: 'COMPLETADO' })}>Completados</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchParams({ estado: 'CANCELADO' })}>Cancelados</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {(searchTerm || searchParams.size > 0) && (
                  <Button variant="outline-danger" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-1"></i>
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          {filteredServices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search display-4 text-muted"></i>
              <h3 className="mt-3 text-muted">No se encontraron servicios</h3>
              {(searchTerm || searchParams.size > 0) && (
                <p className="text-muted">
                  Intenta cambiar los filtros o términos de búsqueda
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover bordered>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Cliente</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Fecha Estimada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id_registro}>
                      <td>{service.id_registro}</td>
                      <td>
                        {service.Vehiculo?.marca} {service.Vehiculo?.modelo}<br/>
                        <small className="text-muted">Placa: {service.Vehiculo?.placa}</small>
                      </td>
                      <td>
                        {service.Vehiculo?.Usuario?.Persona?.nombre} {service.Vehiculo?.Usuario?.Persona?.apellido}
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {service.descripcion_problema}
                        </div>
                      </td>
                      <td>{getStatusBadge(service.estado)}</td>
                      <td>{getPriorityBadge(service.prioridad)}</td>
                      <td>{formatDate(service.fecha_estimada_finalizacion)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link to={`/admin/services/detail/${service.id_registro}`} className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link to={`/admin/services/edit/${service.id_registro}`} className="btn btn-sm btn-outline-secondary">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-dark" size="sm" id={`dropdown-${service.id_registro}`}>
                              <i className="bi bi-three-dots"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item as={Link} to={`/admin/services/assign-work/${service.id_registro}`}>
                                <i className="bi bi-person-check me-2"></i>
                                Asignar Trabajo
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleChangeStatus(service.id_registro, 'PENDIENTE')}
                                disabled={service.estado === 'PENDIENTE'}
                              >
                                Marcar como Pendiente
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleChangeStatus(service.id_registro, 'EN_PROCESO')}
                                disabled={service.estado === 'EN_PROCESO'}
                              >
                                Marcar En Proceso
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleChangeStatus(service.id_registro, 'COMPLETADO')}
                                disabled={service.estado === 'COMPLETADO'}
                              >
                                Marcar como Completado
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleChangeStatus(service.id_registro, 'CANCELADO')}
                                disabled={service.estado === 'CANCELADO'}
                              >
                                Marcar como Cancelado
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
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
