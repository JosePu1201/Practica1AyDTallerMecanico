import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { requestClientAdminService } from '../../../services/requestClientAdminService';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function AdditionalServicesManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [services, setServices] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('TODOS');
  
  const [formData, setFormData] = useState({
    id_servicio_adicional: '',
    id_registro: '',
    id_tipo_trabajo: '',
    id_usuario_empleado: '',
    id_admin_asignacion: '',
    descripcion: '',
    precio: ''
  });

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const parsedUser = JSON.parse(s);
        setUser(parsedUser);
        // Set admin id for assignment
        setFormData(prev => ({ ...prev, id_admin_asignacion: parsedUser.id_usuario }));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch additional services
      const servicesData = await requestClientAdminService.getAdditionalServices();
      setServices(servicesData);
      
      // Fetch maintenance types
      const typesData = await requestClientAdminService.getMaintenanceTypes();
      setMaintenanceTypes(typesData);
      
      // Fetch employees and specialists
      const [employeesData, specialistsData] = await Promise.all([
        serviceManagementService.getEmployees(),
        serviceManagementService.getSpecialists()
      ]);
      
      setEmployees(employeesData);
      setSpecialists(specialistsData);
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const handleAcceptService = (service) => {
    setCurrentService(service);
    setFormData({
      id_servicio_adicional: service.id_servicio_adicional,
      id_registro: service.id_registro,
      id_tipo_trabajo: service.id_tipo_trabajo,
      id_usuario_empleado: '',
      id_admin_asignacion: user?.id_usuario || '',
      descripcion: service.descripcion,
      precio: service.TipoMantenimiento?.precio_base?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDeclineService = async (id) => {
    if (!window.confirm('¿Está seguro de rechazar este servicio adicional?')) {
      return;
    }
    
    try {
      await requestClientAdminService.declineAdditionalService(id);
      setSuccess('Servicio rechazado correctamente');
      
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al rechazar el servicio: ' + err.message);
    }
  };

  const handleSubmitAccept = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.id_usuario_empleado) {
      setError('Por favor seleccione un empleado o especialista');
      return;
    }
    
    if (!formData.precio || isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      setError('Por favor ingrese un precio válido');
      return;
    }
    
    try {
      setModalLoading(true);
      
      await requestClientAdminService.acceptAdditionalService(formData);
      
      setModalLoading(false);
      setShowModal(false);
      setSuccess('Servicio aceptado correctamente');
      
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setModalLoading(false);
      setError('Error al aceptar el servicio: ' + err.message);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SOLICITADO':
        return <Badge bg="warning">Solicitado</Badge>;
      case 'APROBADO':
        return <Badge bg="success">Aprobado</Badge>;
      case 'RECHAZADO':
        return <Badge bg="danger">Rechazado</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="info">Completado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const filteredServices = filterStatus === 'TODOS' 
    ? services 
    : services.filter(service => service.estado === filterStatus);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Servicios Adicionales</h1>
        <div>
          <Link to="/admin/requests" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver al Dashboard
          </Link>
          <Button variant="primary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Filtros</h5>
            <div className="d-flex gap-2">
              <Button 
                variant={filterStatus === 'TODOS' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setFilterStatus('TODOS')}
              >
                Todos
              </Button>
              <Button 
                variant={filterStatus === 'SOLICITADO' ? 'warning' : 'outline-warning'} 
                size="sm"
                onClick={() => setFilterStatus('SOLICITADO')}
              >
                Solicitados
              </Button>
              <Button 
                variant={filterStatus === 'APROBADO' ? 'success' : 'outline-success'} 
                size="sm"
                onClick={() => setFilterStatus('APROBADO')}
              >
                Aprobados
              </Button>
              <Button 
                variant={filterStatus === 'RECHAZADO' ? 'danger' : 'outline-danger'} 
                size="sm"
                onClick={() => setFilterStatus('RECHAZADO')}
              >
                Rechazados
              </Button>
            </div>
          </div>
        </Card.Header>
      </Card>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Servicios Adicionales</h5>
        </Card.Header>
        <div className="table-responsive">
          <Table hover bordered>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehículo</th>
                <th>Tipo de Trabajo</th>
                <th>Descripción</th>
                <th>Fecha Solicitud</th>
                <th>Costo Estimado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 mb-0">Cargando servicios adicionales...</p>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="mt-2 mb-0">No hay servicios adicionales {filterStatus !== 'TODOS' ? `en estado ${filterStatus.toLowerCase()}` : ''}</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map(service => (
                  <tr key={service.id_servicio_adicional}>
                    <td>{service.id_servicio_adicional}</td>
                    <td>
                      <div>{service.RegistroServicioVehiculo?.Vehiculo?.marca} {service.RegistroServicioVehiculo?.Vehiculo?.modelo}</div>
                      <small className="text-muted">{service.RegistroServicioVehiculo?.Vehiculo?.placa}</small>
                    </td>
                    <td>{service.TipoMantenimiento?.nombre_tipo}</td>
                    <td>
                      <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {service.descripcion}
                      </div>
                    </td>
                    <td>
                      {new Date(service.fecha_solicitud).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="text-end">
                      {service.costo_estimado ? `Q${parseFloat(service.costo_estimado).toFixed(2)}` : 'No definido'}
                    </td>
                    <td>{getStatusBadge(service.estado)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        {service.estado === 'SOLICITADO' && (
                          <>
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => handleAcceptService(service)}
                              title="Aprobar Servicio"
                            >
                              <i className="bi bi-check-lg"></i>
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => handleDeclineService(service.id_servicio_adicional)}
                              title="Rechazar Servicio"
                            >
                              <i className="bi bi-x-lg"></i>
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="info" 
                          size="sm" 
                          as={Link}
                          to={`/admin/services/detail/${service.id_registro}`}
                          title="Ver Servicio"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
      
      {/* Accept Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Aceptar Servicio Adicional</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitAccept}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehículo</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={`${currentService?.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${currentService?.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} - ${currentService?.RegistroServicioVehiculo?.Vehiculo?.placa || ''}`}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Trabajo</Form.Label>
                  <Form.Select
                    name="id_tipo_trabajo"
                    value={formData.id_tipo_trabajo}
                    onChange={handleChange}
                  >
                    <option value="">Seleccione un tipo</option>
                    {maintenanceTypes.map(type => (
                      <option key={type.id_tipo_trabajo} value={type.id_tipo_trabajo}>
                        {type.nombre_tipo} - Q{type.precio_base}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción del Trabajo</Form.Label>
              <Form.Control
                as="textarea"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asignar a</Form.Label>
                  <Form.Select
                    name="id_usuario_empleado"
                    value={formData.id_usuario_empleado}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un empleado/especialista</option>
                    <optgroup label="Empleados">
                      {employees.map(employee => (
                        <option key={`emp-${employee.id_usuario}`} value={employee.id_usuario}>
                          {employee.Persona?.nombre} {employee.Persona?.apellido} ({employee.nombre_usuario})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Especialistas">
                      {specialists.map(specialist => (
                        <option key={`spec-${specialist.Usuario.id_usuario}`} value={specialist.Usuario.id_usuario}>
                          {specialist.Usuario.Persona?.nombre} {specialist.Usuario.Persona?.apellido} - {specialist.AreaEspecialista?.nombre_area}
                        </option>
                      ))}
                    </optgroup>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio (Q)</Form.Label>
                  <Form.Control
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
                Cancelar
              </Button>
              <Button variant="success" type="submit" disabled={modalLoading}>
                {modalLoading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>
                    Aceptar y Asignar
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
