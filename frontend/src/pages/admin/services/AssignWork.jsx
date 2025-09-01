import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert, Tabs, Tab, Table, Modal } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function AssignWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);
  
  const [employees, setEmployees] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  
  const [activeTab, setActiveTab] = useState('employee');
  
  const [formData, setFormData] = useState({
    id_tipo_trabajo: '',
    id_registro: id,
    id_usuario_empleado: '',
    id_admin_asignacion: JSON.parse(localStorage.getItem('user'))?.id_usuario || '',
    descripcion: '',
    precio: ''
  });

  // State for assigned works and work reassignment functionality
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState(false);
  const [reassignError, setReassignError] = useState(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoadingService(true);
        
        // Get service details
        const services = await serviceManagementService.getServices();
        const currentService = services.find(s => s.id_registro.toString() === id);
        
        if (!currentService) {
          setError('Servicio no encontrado');
          return;
        }
        
        setService(currentService);
      } catch (err) {
        setError('Error al cargar los detalles del servicio: ' + err.message);
      } finally {
        setLoadingService(false);
      }
    };
    
    const fetchFormLists = async () => {
      try {
        setLoadingLists(true);
        
        // Get employees, specialists and maintenance types
        const [employeesList, specialistsList, maintenanceTypesList] = await Promise.all([
          serviceManagementService.getEmployees(),
          serviceManagementService.getSpecialists(),
          serviceManagementService.getMaintenanceTypes()
        ]);
        
        setEmployees(employeesList);
        setSpecialists(specialistsList);
        setMaintenanceTypes(maintenanceTypesList);
      } catch (err) {
        setError('Error al cargar las listas: ' + err.message);
      } finally {
        setLoadingLists(false);
      }
    };
    
    const fetchAssignedWorks = async () => {
      try {
        setLoadingWorks(true);
        const works = await serviceManagementService.getWorksByServiceId(id);
        setAssignedWorks(works);
      } catch (err) {
        console.error('Error fetching assigned works:', err);
      } finally {
        setLoadingWorks(false);
      }
    };
    
    fetchServiceDetails();
    fetchFormLists();
    fetchAssignedWorks();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If selecting maintenance type, set price from selected type
    if (name === 'id_tipo_trabajo') {
      const selectedType = maintenanceTypes.find(type => type.id_tipo_trabajo === parseInt(value));
      if (selectedType) {
        setFormData({ 
          ...formData, 
          [name]: value,
          precio: selectedType.precio_base.toString()
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.id_tipo_trabajo) return 'Seleccione un tipo de trabajo';
    if (!formData.id_usuario_empleado) return 'Seleccione un empleado o especialista';
    if (!formData.descripcion) return 'Ingrese una descripción del trabajo';
    if (!formData.precio || parseFloat(formData.precio) <= 0) return 'Ingrese un precio válido';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format data
      const dataToSubmit = {
        ...formData,
        id_tipo_trabajo: parseInt(formData.id_tipo_trabajo),
        id_usuario_empleado: parseInt(formData.id_usuario_empleado),
        precio: parseFloat(formData.precio)
      };
      
      await serviceManagementService.assignWork(dataToSubmit);
      
      setSuccess(true);
      
      // Refresh assigned works list
      const works = await serviceManagementService.getWorksByServiceId(id);
      setAssignedWorks(works);
      
      // Reset form
      setFormData({
        id_tipo_trabajo: '',
        id_registro: id,
        id_usuario_empleado: '',
        id_admin_asignacion: JSON.parse(localStorage.getItem('user'))?.id_usuario || '',
        descripcion: '',
        precio: ''
      });
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError('Error al asignar el trabajo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Functions for employee reassignment
  const openReassignModal = (work) => {
    setSelectedWork(work);
    setNewEmployeeId('');
    setReassignError(null);
    setReassignSuccess(false);
    setShowReassignModal(true);
  };

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
      }, 1500);
      
    } catch (err) {
      setReassignError('Error al reasignar el trabajo: ' + err.message);
    } finally {
      setReassignLoading(false);
    }
  };

  if (loadingService) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando detalles del servicio...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>El servicio no fue encontrado o no está disponible.</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/admin/services/list')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Asignar Trabajo</h1>
        <div className="d-flex gap-2">
          <Link to={`/admin/services/detail/${id}`} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Volver a detalles
          </Link>
          <Link to="/admin/services/list" className="btn btn-outline-secondary">
            <i className="bi bi-list me-2"></i>
            Lista de servicios
          </Link>
        </div>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Trabajo asignado exitosamente.
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {/* Service Details Summary */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Detalles del Servicio</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p className="mb-1">
                <strong>Vehículo:</strong> {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
              </p>
              <p className="mb-1">
                <strong>Cliente:</strong> {service.Vehiculo?.Usuario?.Persona?.nombre} {service.Vehiculo?.Usuario?.Persona?.apellido}
              </p>
              <p className="mb-1">
                <strong>ID Servicio:</strong> #{service.id_registro}
              </p>
            </Col>
            <Col md={6}>
              <p className="mb-1">
                <strong>Estado:</strong> {service.estado}
              </p>
              <p className="mb-1">
                <strong>Prioridad:</strong> {service.prioridad}
              </p>
              <p className="mb-1">
                <strong>Fecha Estimada:</strong> {new Date(service.fecha_estimada_finalizacion).toLocaleDateString()}
              </p>
            </Col>
            <Col md={12} className="mt-2">
              <p className="mb-1"><strong>Descripción del Problema:</strong></p>
              <p>{service.descripcion_problema}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Current Assigned Works */}
      {assignedWorks.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Trabajos Asignados Actualmente</h5>
          </Card.Header>
          <Card.Body>
            {loadingWorks ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Cargando trabajos asignados...</span>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo de Trabajo</th>
                      <th>Persona Asignada</th>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedWorks.map(work => (
                      <tr key={work.id_asignacion}>
                        <td>#{work.id_asignacion}</td>
                        <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div>
                              {work.empleadoAsignado?.Persona?.nombre} {work.empleadoAsignado?.Persona?.apellido}
                              <div className="text-muted small">@{work.empleadoAsignado?.nombre_usuario}</div>
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
                          <span className={`badge bg-${
                            work.estado === 'ASIGNADO' ? 'warning' :
                            work.estado === 'EN_PROCESO' ? 'primary' :
                            work.estado === 'COMPLETADO' ? 'success' :
                            'secondary'
                          }`}>
                            {work.estado || 'ASIGNADO'}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {work.descripcion}
                          </div>
                        </td>
                        <td className="text-end">Q{parseFloat(work.precio).toFixed(2)}</td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            as={Link}
                            to={`/admin/services/detail/${id}`}
                            title="Ver detalles"
                          >
                            <i className="bi bi-eye"></i>
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
      )}
      
      {/* Assignment Form */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Asignar Nuevo Trabajo</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="id_tipo_trabajo">
                  <Form.Label>Tipo de Trabajo</Form.Label>
                  <Form.Select
                    name="id_tipo_trabajo"
                    value={formData.id_tipo_trabajo}
                    onChange={handleChange}
                    disabled={loadingLists || loading}
                    required
                  >
                    <option value="">Seleccione un tipo de trabajo</option>
                    {maintenanceTypes.map(type => (
                      <option key={type.id_tipo_trabajo} value={type.id_tipo_trabajo}>
                        {type.nombre_tipo} - Q{type.precio_base}
                      </option>
                    ))}
                  </Form.Select>
                  {loadingLists && (
                    <div className="text-center mt-2">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2">Cargando tipos...</span>
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="precio">
                  <Form.Label>Precio</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="id_usuario_empleado">
                  <Form.Label>Seleccionar Persona a Asignar</Form.Label>
                  <Form.Select
                    name="id_usuario_empleado"
                    value={formData.id_usuario_empleado}
                    onChange={handleChange}
                    disabled={loadingLists || loading}
                    required
                  >
                    <option value="">Seleccione una persona</option>
                    {activeTab === 'employee' ? (
                      employees.map(employee => (
                        <option key={employee.id_usuario} value={employee.id_usuario}>
                          {employee.Persona?.nombre} {employee.Persona?.apellido} ({employee.nombre_usuario})
                        </option>
                      ))
                    ) : (
                      specialists.map(specialist => (
                        <option key={specialist.Usuario.id_usuario} value={specialist.Usuario.id_usuario}>
                          {specialist.Usuario.Persona?.nombre} {specialist.Usuario.Persona?.apellido} - 
                          {specialist.TipoTecnico?.nombre_tipo} ({specialist.AreaEspecialista?.nombre_area})
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                // Reset the selected user when switching tabs
                setFormData({...formData, id_usuario_empleado: ''});
              }}
              id="assign-tabs"
              className="mb-4"
            >
              <Tab eventKey="employee" title="Empleados">
                <p className="text-muted">
                  Seleccione un empleado para asignarle este trabajo. Los empleados manejan tareas generales del taller.
                </p>
              </Tab>
              <Tab eventKey="specialist" title="Especialistas">
                <p className="text-muted">
                  Seleccione un especialista para asignarle este trabajo. Los especialistas tienen conocimientos específicos en ciertas áreas.
                </p>
              </Tab>
            </Tabs>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="descripcion">
                  <Form.Label>Descripción del Trabajo a Realizar</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" as={Link} to={`/admin/services/detail/${id}`} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Asignando...
                  </>
                ) : (
                  'Asignar Trabajo'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

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
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReassignModal(false)} disabled={reassignLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleReassign} disabled={reassignLoading || !newEmployeeId}>
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
