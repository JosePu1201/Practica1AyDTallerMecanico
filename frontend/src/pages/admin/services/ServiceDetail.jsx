import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Tab, Tabs, Table, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setLoading(true);
        
        // Get all services
        const services = await serviceManagementService.getServices();
        const currentService = services.find(s => s.id_registro.toString() === id);
        
        if (!currentService) {
          setError('Servicio no encontrado');
          setLoading(false);
          return;
        }
        
        setService(currentService);
        
        // Get assigned works for this service
        const allEmployees = await serviceManagementService.getEmployees();
        
        // We'll need to fetch work assignments for each employee to find ones related to this service
        const workPromises = allEmployees.map(employee => 
          serviceManagementService.getWorksEmployee(employee.id_usuario)
        );
        
        const allWorks = await Promise.all(workPromises);
        
        // Flatten the array and filter works for this service
        const works = allWorks
          .flat()
          .filter(work => work.id_registro.toString() === id);
        
        setAssignedWorks(works);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los detalles del servicio: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchServiceDetail();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await serviceManagementService.updateServiceStatus(id, newStatus);
      setService({ ...service, estado: newStatus });
    } catch (err) {
      setError('Error al actualizar el estado: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning" className="fs-6">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary" className="fs-6">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success" className="fs-6">Completado</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger" className="fs-6">Cancelado</Badge>;
      default:
        return <Badge bg="secondary" className="fs-6">{status}</Badge>;
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
        return <Badge bg="secondary">{priority}</Badge>;
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
        <p className="mt-2">Cargando detalles del servicio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/admin/services/list')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  if (!service) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Servicio no encontrado</Alert.Heading>
        <p>El servicio solicitado no existe o ha sido eliminado.</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-warning" onClick={() => navigate('/admin/services/list')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detalles del Servicio #{service.id_registro}</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/services/list" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Volver a la lista
          </Link>
          <Link to={`/admin/services/edit/${service.id_registro}`} className="btn btn-outline-primary">
            <i className="bi bi-pencil me-2"></i>
            Editar Servicio
          </Link>
          <Link to={`/admin/services/assign-work/${service.id_registro}`} className="btn btn-primary">
            <i className="bi bi-person-check me-2"></i>
            Asignar Trabajo
          </Link>
        </div>
      </div>

      <div className="bg-light rounded p-4 mb-4">
        <Row>
          <Col md={8}>
            <h2>
              {service.Vehiculo?.marca} {service.Vehiculo?.modelo}
              <span className="text-muted ms-2 fs-5">
                Placa: {service.Vehiculo?.placa}
              </span>
            </h2>
            <p className="mb-2 fs-5">
              Cliente: {service.Vehiculo?.Usuario?.Persona?.nombre} {service.Vehiculo?.Usuario?.Persona?.apellido}
            </p>
          </Col>
          <Col md={4} className="text-md-end">
            <div className="mb-2">
              Estado: {getStatusBadge(service.estado)}
            </div>
            <div>
              Prioridad: {getPriorityBadge(service.prioridad)}
            </div>
          </Col>
        </Row>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        id="service-detail-tabs"
        className="mb-4"
      >
        <Tab eventKey="details" title="Detalles del Servicio">
          <Card>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5 className="mb-3">Información del Servicio</h5>
                  <dl className="row">
                    <dt className="col-sm-4">ID del Servicio</dt>
                    <dd className="col-sm-8">#{service.id_registro}</dd>

                    <dt className="col-sm-4">Estado</dt>
                    <dd className="col-sm-8">{getStatusBadge(service.estado)}</dd>
                    
                    <dt className="col-sm-4">Prioridad</dt>
                    <dd className="col-sm-8">{getPriorityBadge(service.prioridad)}</dd>
                    
                    <dt className="col-sm-4">Fecha de Registro</dt>
                    <dd className="col-sm-8">{formatDate(service.fecha_registro)}</dd>
                    
                    <dt className="col-sm-4">Fecha Estimada</dt>
                    <dd className="col-sm-8">{formatDate(service.fecha_estimada_finalizacion)}</dd>
                  </dl>

                  <h5 className="mb-3 mt-4">Cambiar Estado</h5>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button 
                      variant="outline-warning" 
                      onClick={() => handleStatusChange('PENDIENTE')}
                      disabled={service.estado === 'PENDIENTE'}
                    >
                      Pendiente
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => handleStatusChange('EN_PROCESO')}
                      disabled={service.estado === 'EN_PROCESO'}
                    >
                      En Proceso
                    </Button>
                    <Button 
                      variant="outline-success" 
                      onClick={() => handleStatusChange('COMPLETADO')}
                      disabled={service.estado === 'COMPLETADO'}
                    >
                      Completado
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      onClick={() => handleStatusChange('CANCELADO')}
                      disabled={service.estado === 'CANCELADO'}
                    >
                      Cancelado
                    </Button>
                  </div>
                </Col>
                
                <Col md={6}>
                  <h5 className="mb-3">Información del Vehículo</h5>
                  <dl className="row">
                    <dt className="col-sm-4">Marca</dt>
                    <dd className="col-sm-8">{service.Vehiculo?.marca}</dd>
                    
                    <dt className="col-sm-4">Modelo</dt>
                    <dd className="col-sm-8">{service.Vehiculo?.modelo}</dd>
                    
                    <dt className="col-sm-4">Año</dt>
                    <dd className="col-sm-8">{service.Vehiculo?.anio}</dd>
                    
                    <dt className="col-sm-4">Placa</dt>
                    <dd className="col-sm-8">{service.Vehiculo?.placa}</dd>
                    
                    <dt className="col-sm-4">Color</dt>
                    <dd className="col-sm-8">{service.Vehiculo?.color}</dd>
                    
                    <dt className="col-sm-4">Cliente</dt>
                    <dd className="col-sm-8">
                      {service.Vehiculo?.Usuario?.Persona?.nombre} {service.Vehiculo?.Usuario?.Persona?.apellido}
                    </dd>
                  </dl>
                </Col>
              </Row>
              
              <hr />
              
              <Row>
                <Col md={12}>
                  <h5>Descripción del Problema</h5>
                  <p>{service.descripcion_problema}</p>
                </Col>
              </Row>
              
              {service.observaciones_iniciales && (
                <Row>
                  <Col md={12}>
                    <h5>Observaciones Iniciales</h5>
                    <p>{service.observaciones_iniciales}</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="works" title="Trabajos Asignados">
          <Card>
            <Card.Body>
              {assignedWorks.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-clipboard-x display-4 text-muted"></i>
                  <h3 className="mt-3 text-muted">No hay trabajos asignados</h3>
                  <p className="text-muted">
                    Este servicio no tiene trabajos asignados aún.
                  </p>
                  <Link to={`/admin/services/assign-work/${service.id_registro}`} className="btn btn-primary mt-2">
                    <i className="bi bi-person-check me-2"></i>
                    Asignar Trabajo
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover bordered>
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Tipo de Trabajo</th>
                        <th>Asignado a</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedWorks.map(work => (
                        <tr key={work.id_asignacion_trabajo}>
                          <td>{work.id_asignacion_trabajo}</td>
                          <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                          <td>
                            {work.Usuario?.Persona?.nombre} {work.Usuario?.Persona?.apellido}
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {work.descripcion}
                            </div>
                          </td>
                          <td>${work.precio.toFixed(2)}</td>
                          <td>
                            <Badge bg={
                              work.estado === 'PENDIENTE' ? 'warning' :
                              work.estado === 'EN_PROCESO' ? 'primary' :
                              work.estado === 'COMPLETADO' ? 'success' :
                              'secondary'
                            }>
                              {work.estado}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button size="sm" variant="outline-primary">
                                <i className="bi bi-eye"></i>
                              </Button>
                              <Button size="sm" variant="outline-secondary">
                                <i className="bi bi-pencil"></i>
                              </Button>
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
        </Tab>
        
        <Tab eventKey="history" title="Historial">
          <Card>
            <Card.Body>
              <div className="text-center py-5">
                <i className="bi bi-clock-history display-4 text-muted"></i>
                <h3 className="mt-3 text-muted">Historial del Servicio</h3>
                <p className="text-muted">
                  El historial detallado estará disponible próximamente.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
