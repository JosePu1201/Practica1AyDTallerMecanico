import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Tab, Tabs, Table, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';
import './styles/ServiceDetail.css'; // Import the CSS

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // States for employee reassignment
  const [employees, setEmployees] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState(false);
  const [reassignError, setReassignError] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        setLoading(true);
        
        // Get all services to find the current one
        const services = await serviceManagementService.getServices();
        const currentService = services.find(s => s.id_registro.toString() === id);
        
        if (!currentService) {
          setError('Servicio no encontrado');
          setLoading(false);
          return;
        }
        
        setService(currentService);
        
        // Get assigned works for this service using the new endpoint
        const works = await serviceManagementService.getWorksByServiceId(id);
        setAssignedWorks(works);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los detalles del servicio: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchServiceDetail();
  }, [id]);

  // Load employees and specialists when reassign modal opens
  const loadEmployeesData = async () => {
    try {
      setLoadingEmployees(true);
      const [employeesList, specialistsList] = await Promise.all([
        serviceManagementService.getEmployees(),
        serviceManagementService.getSpecialists()
      ]);
      setEmployees(employeesList);
      setSpecialists(specialistsList);
      setLoadingEmployees(false);
    } catch (err) {
      console.error('Error loading employees and specialists:', err);
      setReassignError('Error al cargar la lista de empleados y especialistas');
      setLoadingEmployees(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await serviceManagementService.updateServiceStatus(id, newStatus);
      setService({ ...service, estado: newStatus });
    } catch (err) {
      setError('Error al actualizar el estado: ' + err.message);
    }
  };

  // Open reassign modal and load employee data
  const openReassignModal = (work) => {
    setSelectedWork(work);
    setNewEmployeeId('');
    setReassignError(null);
    setReassignSuccess(false);
    setShowReassignModal(true);
    loadEmployeesData();
  };

  // Handle employee reassignment
  const handleReassign = async () => {
    if (!selectedWork || !newEmployeeId) {
      setReassignError('Por favor seleccione un empleado');
      return;
    }

    try {
      setReassignLoading(true);
      setReassignError(null);
      
      await serviceManagementService.changeEmployeeWork({
        id_asignacion: selectedWork.id_asignacion,
        id_usuario_empleado: parseInt(newEmployeeId)
      });
      
      setReassignSuccess(true);
      
      // Refresh assigned works list
      const works = await serviceManagementService.getWorksByServiceId(id);
      setAssignedWorks(works);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowReassignModal(false);
        setReassignSuccess(false);
      }, 1500);
      
    } catch (err) {
      setReassignError('Error al reasignar el trabajo: ' + err.message);
    } finally {
      setReassignLoading(false);
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

  // Loading, error, and not found states
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
    <div className="service-detail-container">
      {/* Header with improved styling */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm">
        <h1 className="text-primary mb-0">
          Servicio #{service.id_registro}
        </h1>
        <div className="d-flex gap-2">
          <Link to="/admin/services/list" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Link>
          <Link to={`/admin/services/edit/${service.id_registro}`} className="btn btn-outline-primary">
            <i className="bi bi-pencil me-2"></i>
            Editar
          </Link>
          <Link to={`/admin/services/assign-work/${service.id_registro}`} className="btn btn-primary">
            <i className="bi bi-person-check me-2"></i>
            Asignar Trabajo
          </Link>
        </div>
      </div>

      {/* Summary card with improved styling */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Resumen del Servicio</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="d-flex align-items-center mb-3">
                <div className="vehicle-icon me-3 bg-light p-3 rounded-circle">
                  <i className="bi bi-car-front fs-3 text-primary"></i>
                </div>
                <div>
                  <h3 className="mb-1">
                    {service.Vehiculo?.marca} {service.Vehiculo?.modelo}
                  </h3>
                  <p className="text-muted mb-0">
                    Placa: <strong>{service.Vehiculo?.placa}</strong> | 
                    Año: <strong>{service.Vehiculo?.anio}</strong> | 
                    Color: <strong>{service.Vehiculo?.color}</strong>
                  </p>
                </div>
              </div>
              <div className="customer-info p-3 border-start ps-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-2 text-secondary fs-5"></i>
                  <h5 className="mb-0">
                    {service.Vehiculo?.Usuario?.Persona?.nombre} {service.Vehiculo?.Usuario?.Persona?.apellido}
                  </h5>
                </div>
                <p className="text-muted mb-0 small">
                  Cliente #{service.Vehiculo?.Usuario?.id_usuario} | 
                  Usuario: {service.Vehiculo?.Usuario?.nombre_usuario}
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="service-status p-3 bg-light rounded text-center">
                <div className="mb-3">
                  <div className="mb-2">Estado Actual:</div>
                  {getStatusBadge(service.estado)}
                </div>
                <div>
                  <div className="mb-2">Prioridad:</div>
                  {getPriorityBadge(service.prioridad)}
                </div>
              </div>
              <div className="service-dates mt-3 text-center">
                <div className="row">
                  <div className="col-6 border-end">
                    <small className="text-muted d-block">Ingreso</small>
                    <span>{formatDate(service.fecha_ingreso)}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Est. Finalización</small>
                    <span>{formatDate(service.fecha_estimada_finalizacion)}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        id="service-detail-tabs"
        className="mb-4"
      >
        <Tab eventKey="details" title="Detalles del Servicio">
          <Card className="shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="border-bottom pb-2 mb-3">Descripción del Problema</h5>
                  <div className="p-3 bg-light rounded">
                    <p className="mb-0">{service.descripcion_problema}</p>
                  </div>
                </Col>
              </Row>
              
              {service.observaciones_iniciales && (
                <Row className="mb-4">
                  <Col md={12}>
                    <h5 className="border-bottom pb-2 mb-3">Observaciones Iniciales</h5>
                    <div className="p-3 bg-light rounded">
                      <p className="mb-0">{service.observaciones_iniciales}</p>
                    </div>
                  </Col>
                </Row>
              )}
              
              <Row>
                <Col md={12}>
                  <h5 className="border-bottom pb-2 mb-3">Acciones Disponibles</h5>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    <Button 
                      variant={service.estado === 'PENDIENTE' ? 'warning' : 'outline-warning'}
                      size="lg" 
                      onClick={() => handleStatusChange('PENDIENTE')}
                      disabled={service.estado === 'PENDIENTE'}
                      className="action-button"
                    >
                      <i className="bi bi-hourglass me-2"></i>
                      Pendiente
                    </Button>
                    <Button 
                      variant={service.estado === 'EN_PROCESO' ? 'primary' : 'outline-primary'}
                      size="lg" 
                      onClick={() => handleStatusChange('EN_PROCESO')}
                      disabled={service.estado === 'EN_PROCESO'}
                      className="action-button"
                    >
                      <i className="bi bi-gear-fill me-2"></i>
                      En Proceso
                    </Button>
                    <Button 
                      variant={service.estado === 'COMPLETADO' ? 'success' : 'outline-success'}
                      size="lg" 
                      onClick={() => handleStatusChange('COMPLETADO')}
                      disabled={service.estado === 'COMPLETADO'}
                      className="action-button"
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Completado
                    </Button>
                    <Button 
                      variant={service.estado === 'CANCELADO' ? 'danger' : 'outline-danger'}
                      size="lg" 
                      onClick={() => handleStatusChange('CANCELADO')}
                      disabled={service.estado === 'CANCELADO'}
                      className="action-button"
                    >
                      <i className="bi bi-x-circle-fill me-2"></i>
                      Cancelado
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="works" title="Trabajos Asignados">
          <Card className="shadow-sm">
            <Card.Body>
              {assignedWorks.length === 0 ? (
                <div className="text-center py-5">
                  <div className="empty-state-icon mb-3">
                    <i className="bi bi-clipboard-x display-4 text-muted"></i>
                  </div>
                  <h3 className="text-muted">No hay trabajos asignados</h3>
                  <p className="text-muted mb-4">
                    Este servicio no tiene trabajos asignados aún.
                  </p>
                  <Link to={`/admin/services/assign-work/${service.id_registro}`} className="btn btn-primary btn-lg">
                    <i className="bi bi-person-check me-2"></i>
                    Asignar Trabajo
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Trabajos asignados al servicio</h5>
                    <Link to={`/admin/services/assign-work/${service.id_registro}`} className="btn btn-sm btn-primary">
                      <i className="bi bi-plus-circle me-1"></i> Nuevo Trabajo
                    </Link>
                  </div>
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle">
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
                          <tr key={work.id_asignacion}>
                            <td>{work.id_asignacion}</td>
                            <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm me-2 bg-light rounded-circle d-flex align-items-center justify-content-center">
                                  <i className="bi bi-person text-secondary"></i>
                                </div>
                                <div>
                                  {work.empleadoAsignado?.Persona?.nombre} {work.empleadoAsignado?.Persona?.apellido}
                                  <small className="d-block text-muted">{work.empleadoAsignado?.nombre_usuario}</small>
                                </div>
                                <Button 
                                  variant="link" 
                                  className="ms-2 p-0" 
                                  onClick={() => openReassignModal(work)}
                                  title="Cambiar empleado asignado"
                                >
                                  <i className="bi bi-pencil-square text-primary"></i>
                                </Button>
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {work.descripcion}
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="p-0 ms-2"
                                  title="Ver descripción completa"
                                >
                                  <i className="bi bi-eye-fill"></i>
                                </Button>
                              </div>
                            </td>
                            <td className="text-end fw-bold">Q{Number(work.precio).toFixed(2)}</td>
                            <td className="text-center">
                              <Badge bg={
                                work.estado === 'ASIGNADO' ? 'warning' :
                                work.estado === 'EN_PROCESO' ? 'primary' :
                                work.estado === 'COMPLETADO' ? 'success' :
                                'secondary'
                              }>
                                {work.estado || 'ASIGNADO'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1 justify-content-center">
                                <Button size="sm" variant="outline-primary" title="Ver detalles">
                                  <i className="bi bi-eye"></i>
                                </Button>
                                <Button size="sm" variant="outline-secondary" title="Editar">
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="4" className="text-end fw-bold">Total:</td>
                          <td className="text-end fw-bold">
                            Q{assignedWorks.reduce((sum, work) => sum + Number(work.precio), 0).toFixed(2)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="history" title="Historial">
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-center py-5">
                <div className="empty-state-icon mb-3">
                  <i className="bi bi-clock-history display-4 text-muted"></i>
                </div>
                <h3 className="text-muted">Historial del Servicio</h3>
                <p className="text-muted">
                  El historial detallado estará disponible próximamente.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Reassign Employee Modal */}
      <Modal show={showReassignModal} onHide={() => setShowReassignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Persona Asignada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reassignSuccess && (
            <Alert variant="success" className="mb-3">
              <i className="bi bi-check-circle me-2"></i>
              Empleado cambiado exitosamente.
            </Alert>
          )}
          
          {reassignError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {reassignError}
            </Alert>
          )}

          {selectedWork && (
            <>
              <p>
                <strong>Trabajo:</strong> {selectedWork.TipoMantenimiento?.nombre_tipo}
              </p>
              <p>
                <strong>Actualmente asignado a:</strong> {selectedWork.empleadoAsignado?.Persona?.nombre} {selectedWork.empleadoAsignado?.Persona?.apellido}
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Seleccione el nuevo empleado/especialista</Form.Label>
                {loadingEmployees ? (
                  <div className="text-center my-3">
                    <Spinner size="sm" animation="border" className="me-2" />
                    <span>Cargando empleados...</span>
                  </div>
                ) : (
                  <Form.Select 
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    disabled={reassignLoading}
                  >
                    <option value="">Seleccione una persona</option>
                    <optgroup label="Empleados">
                      {employees.map(employee => (
                        <option key={employee.id_usuario} value={employee.id_usuario}>
                          {employee.Persona?.nombre} {employee.Persona?.apellido} ({employee.nombre_usuario})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Especialistas">
                      {specialists.map(specialist => (
                        <option key={specialist.Usuario.id_usuario} value={specialist.Usuario.id_usuario}>
                          {specialist.Usuario.Persona?.nombre} {specialist.Usuario.Persona?.apellido} - 
                          {specialist.TipoTecnico?.nombre_tipo}
                        </option>
                      ))}
                    </optgroup>
                  </Form.Select>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReassignModal(false)} disabled={reassignLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleReassign} disabled={reassignLoading || !newEmployeeId || loadingEmployees}>
            {reassignLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cambiando...
              </>
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
