import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function SupportRequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workId = searchParams.get('workId');
  
  const [loading, setLoading] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [loadingSpecialists, setLoadingSpecialists] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [assignedWorks, setAssignedWorks] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  
  const [formData, setFormData] = useState({
    id_asignacion_trabajo: workId || '',
    id_usuario_especialista: '',
    descripcion_apoyo: ''
  });

  // Get user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch assigned works for dropdown when user is loaded
  useEffect(() => {
    const fetchAssignedWorks = async () => {
      if (!user?.id_usuario) return;
      
      try {
        setLoadingWorks(true);
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        // Filter only active works
        const activeWorks = works.filter(work => 
          work.estado !== 'COMPLETADO' && work.estado !== 'CANCELADO'
        );
        setAssignedWorks(activeWorks);
        
        // If workId is provided, find the corresponding work details
        if (workId) {
          const workDetail = works.find(w => w.id_asignacion.toString() === workId);
          if (workDetail) {
            setSelectedWork(workDetail);
          }
        }
        
        setLoadingWorks(false);
      } catch (err) {
        setError('Error al cargar los trabajos asignados: ' + err.message);
        setLoadingWorks(false);
      }
    };
    
    fetchAssignedWorks();
  }, [user, workId]);

  // Load specialists
  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        setLoadingSpecialists(true);
        const data = await serviceSpecialistService.getSpecialists();
        // Ensure we don't include the current specialist in the list
        const filteredSpecialists = user ? 
          data.filter(specialist => specialist.id_usuario !== user.id_usuario) : 
          data;
        setSpecialists(filteredSpecialists);
        setLoadingSpecialists(false);
      } catch (err) {
        setError('Error al cargar especialistas: ' + err.message);
        setLoadingSpecialists(false);
      }
    };
    
    fetchSpecialists();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing the work, update selectedWork state
    if (name === 'id_asignacion_trabajo' && value) {
      const work = assignedWorks.find(w => w.id_asignacion.toString() === value);
      setSelectedWork(work);
    }
    
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.id_asignacion_trabajo || !formData.id_usuario_especialista || !formData.descripcion_apoyo) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceSpecialistService.createSupportRequest(formData);
      
      setSuccess(true);
      setFormData({
        ...formData,
        descripcion_apoyo: '',
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate(`/specialist/works/${formData.id_asignacion_trabajo}`);
      }, 1500);
      
    } catch (err) {
      setError('Error al crear la solicitud de apoyo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Solicitar Apoyo</h1>
        <Link 
          to={formData.id_asignacion_trabajo ? `/specialist/works/${formData.id_asignacion_trabajo}` : '/specialist/support'} 
          className="btn btn-outline-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i> Volver
        </Link>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Solicitud de apoyo creada exitosamente. Redireccionando...
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Formulario de Solicitud de Apoyo</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {!workId && (
              <Form.Group className="mb-3">
                <Form.Label>Trabajo asignado</Form.Label>
                {loadingWorks ? (
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Cargando trabajos asignados...</span>
                  </div>
                ) : (
                  <>
                    <Form.Select
                      name="id_asignacion_trabajo"
                      value={formData.id_asignacion_trabajo}
                      onChange={handleChange}
                      disabled={loading || !!workId}
                      required
                    >
                      <option value="">Seleccione un trabajo</option>
                      {assignedWorks.map(work => (
                        <option key={work.id_asignacion} value={work.id_asignacion}>
                          #{work.id_asignacion} - {work.TipoMantenimiento?.nombre_tipo} - 
                          {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                        </option>
                      ))}
                    </Form.Select>
                    {assignedWorks.length === 0 && !loadingWorks && (
                      <Form.Text className="text-danger">
                        No tiene trabajos activos asignados.
                      </Form.Text>
                    )}
                  </>
                )}
              </Form.Group>
            )}
            
            {/* Display selected work details if one is selected */}
            {selectedWork && (
              <div className="selected-work-details bg-light p-3 rounded mb-3">
                <h6 className="border-bottom pb-2 mb-3">Detalles del Trabajo Seleccionado</h6>
                <Row>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Vehículo:</dt>
                      <dd className="col-sm-8">
                        {selectedWork.RegistroServicioVehiculo?.Vehiculo?.marca} {selectedWork.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </dd>
                      
                      <dt className="col-sm-4">Placa:</dt>
                      <dd className="col-sm-8">{selectedWork.RegistroServicioVehiculo?.Vehiculo?.placa}</dd>
                    </dl>
                  </Col>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Tipo:</dt>
                      <dd className="col-sm-8">{selectedWork.TipoMantenimiento?.nombre_tipo}</dd>
                      
                      <dt className="col-sm-4">Estado:</dt>
                      <dd className="col-sm-8">{selectedWork.estado}</dd>
                    </dl>
                  </Col>
                </Row>
                <div className="mt-2">
                  <strong>Descripción del problema:</strong>
                  <p className="mb-0 small">{selectedWork.RegistroServicioVehiculo?.descripcion_problema}</p>
                </div>
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Especialista a consultar</Form.Label>
              {loadingSpecialists ? (
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Cargando especialistas...</span>
                </div>
              ) : (
                <>
                  <Form.Select
                    name="id_usuario_especialista"
                    value={formData.id_usuario_especialista}
                    onChange={handleChange}
                    disabled={loading || loadingSpecialists}
                    required
                  >
                    <option value="">Seleccione un especialista</option>
                    {specialists.map(specialist => (
                      <option key={specialist.id_usuario} value={specialist.id_usuario}>
                        {specialist.Persona?.nombre} {specialist.Persona?.apellido} - 
                        {specialist.AreaEspecialista?.nombre_area || ''} / {specialist.TipoTecnico?.nombre_tipo || ''}
                      </option>
                    ))}
                  </Form.Select>
                  {specialists.length === 0 && !loadingSpecialists && (
                    <Form.Text className="text-danger">
                      No hay otros especialistas disponibles.
                    </Form.Text>
                  )}
                </>
              )}
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Descripción del apoyo requerido</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="descripcion_apoyo"
                value={formData.descripcion_apoyo}
                onChange={handleChange}
                placeholder="Describa detalladamente el tipo de ayuda que necesita"
                disabled={loading}
                required
              />
              <Form.Text className="text-muted">
                Sea lo más específico posible sobre el problema y el tipo de apoyo que requiere.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                as={Link} 
                to={formData.id_asignacion_trabajo ? `/specialist/works/${formData.id_asignacion_trabajo}` : '/specialist/support'}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading || !formData.id_asignacion_trabajo || !formData.id_usuario_especialista}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}