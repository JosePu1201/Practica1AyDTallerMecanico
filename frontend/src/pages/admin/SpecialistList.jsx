import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function SpecialistList() {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [areas, setAreas] = useState([]);
  const [tiposTecnico, setTiposTecnico] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    id_usuario: '',
    id_area_especialista: '',
    id_tipo_tecnico: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  useEffect(() => {
    fetchSpecialists();
    fetchAreas();
    fetchTiposTecnico();
  }, []);
  
  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/management/users/specialists');
      setSpecialists(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los especialistas: ' + (err.response?.data?.error || err.message));
      toast.error('Error al cargar los especialistas');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAreas = async () => {
    try {
      const response = await axios.get('/api/management/users/areas');
      setAreas(response.data);
    } catch (err) {
      toast.error('Error al cargar las áreas de especialidad');
    }
  };
  
  const fetchTiposTecnico = async () => {
    try {
      const response = await axios.get('/api/management/users/tipos');
      setTiposTecnico(response.data);
    } catch (err) {
      toast.error('Error al cargar los tipos de técnicos');
    }
  };
  
  const fetchAvailableUsers = async () => {
    try {
      // Get users with role 2 (technician/specialist) that don't have specialist assignments
      const response = await axios.get('/api/management/users?role=2&unassigned=true');
      setUsers(response.data);
    } catch (err) {
      toast.error('Error al cargar usuarios disponibles');
    }
  };
  
  const openAssignModal = async () => {
    await fetchAvailableUsers();
    setFormData({
      id_usuario: '',
      id_area_especialista: '',
      id_tipo_tecnico: ''
    });
    setFormErrors({});
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is modified
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.id_usuario) {
      errors.id_usuario = 'Debe seleccionar un usuario';
    }
    
    if (!formData.id_area_especialista) {
      errors.id_area_especialista = 'Debe seleccionar un área de especialidad';
    }
    
    if (!formData.id_tipo_tecnico) {
      errors.id_tipo_tecnico = 'Debe seleccionar un tipo de técnico';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setFormSubmitting(true);
    //console.log(formData);
    try {
      await axios.post('/api/management/users/asignar-especializacion', {
        id_usuario: formData.id_usuario,
        id_area_especialista: formData.id_area_especialista,
        id_tipo_tecnico: formData.id_tipo_tecnico
      });
      
      toast.success('Especialización asignada con éxito');
      fetchSpecialists();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ha ocurrido un error';
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
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
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Especialistas y Técnicos</h1>
        <div>
          <Button variant="primary" onClick={openAssignModal}>
            <i className="bi bi-plus-circle me-1"></i> Asignar Especialización
          </Button>
        </div>
      </div>
      
      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Área de Especialidad</th>
                <th>Tipo de Técnico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {specialists.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No hay especialistas registrados</td>
                </tr>
              ) : (
                specialists.map(specialist => (
                  <tr key={specialist.id_especialista || specialist.id_usuario}>
                    <td>{specialist.id_usuario}</td>
                    <td>
                      {specialist.Usuario?.Persona?.nombre} {specialist.Usuario?.Persona?.apellido}
                    </td>
                    <td>{specialist.Usuario?.nombre_usuario}</td>
                    <td>
                      <Badge bg="info">
                        {specialist.AreaEspecialistum?.nombre_area || 'No asignada'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">
                        {specialist.TipoTecnico?.nombre_tipo || 'No asignado'}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link 
                          to={`/admin/usuarios/detalle/${specialist.id_usuario}`}
                          className="btn btn-outline-info"
                          title="Ver detalles"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Button 
                          variant="outline-primary"
                          title="Editar especialización"
                        >
                          <i className="bi bi-gear"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Modal for Assigning Specialization */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Asignar Especialización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Usuario <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="id_usuario"
                value={formData.id_usuario}
                onChange={handleChange}
                isInvalid={!!formErrors.id_usuario}
              >
                <option value="">Seleccione un usuario</option>
                {users.map(user => (
                  <option key={user.id_usuario} value={user.id_usuario}>
                    {user.persona?.nombre} {user.persona?.apellido} ({user.nombre_usuario})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.id_usuario}
              </Form.Control.Feedback>
              {users.length === 0 && (
                <Form.Text className="text-muted">
                  No hay usuarios disponibles para asignar. Asegúrese de que existan usuarios con rol de técnico/especialista.
                </Form.Text>
              )}
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Área de Especialidad <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="id_area_especialista"
                    value={formData.id_area_especialista}
                    onChange={handleChange}
                    isInvalid={!!formErrors.id_area_especialista}
                  >
                    <option value="">Seleccione un área</option>
                    {areas.map(area => (
                      <option key={area.id_area_especialista} value={area.id_area_especialista}>
                        {area.nombre_area}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.id_area_especialista}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Técnico <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="id_tipo_tecnico"
                    value={formData.id_tipo_tecnico}
                    onChange={handleChange}
                    isInvalid={!!formErrors.id_tipo_tecnico}
                  >
                    <option value="">Seleccione un tipo</option>
                    {tiposTecnico.map(tipo => (
                      <option key={tipo.id_tipo_tecnico} value={tipo.id_tipo_tecnico}>
                        {tipo.nombre_tipo}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.id_tipo_tecnico}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Asignando...
              </>
            ) : (
              'Asignar Especialización'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
