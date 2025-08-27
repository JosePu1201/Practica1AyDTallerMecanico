import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function DiagnosticForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workId = searchParams.get('workId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [work, setWork] = useState(null);
  const [loadingWork, setLoadingWork] = useState(workId ? true : false);
  const [detailsData, setDetailsData] = useState([
    {
      tipo_diagnostico: 'MECANICO',
      descripcion: '',
      severidad: 'MEDIA'
    }
  ]);
  
  const [formData, setFormData] = useState({
    id_asignacion_trabajo: workId || '',
    id_usuario_especialista: '',
    observaciones_generales: ''
  });
  
  const [availableWorks, setAvailableWorks] = useState([]);

  // Get user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const userData = JSON.parse(s);
        setUser(userData);
        setFormData(prevState => ({
          ...prevState,
          id_usuario_especialista: userData.id_usuario
        }));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  
  // Fetch work details if workId is provided
  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!workId || !user?.id_usuario) return;
      
      try {
        setLoadingWork(true);
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        const currentWork = works.find(w => w.id_asignacion.toString() === workId);
        console.log(works);
        if (currentWork) {
          setWork(currentWork);
        }
        
        setLoadingWork(false);
      } catch (err) {
        setError('Error al cargar los detalles del trabajo: ' + err.message);
        setLoadingWork(false);
      }
    };
    
    fetchWorkDetails();
  }, [workId, user]);
  
  // Add new effect to fetch available works for dropdown when no workId is provided
  useEffect(() => {
    const fetchAvailableWorks = async () => {
      if (workId || !user?.id_usuario) return;
      
      try {
        setLoadingWork(true);
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        // Filter to include only non-completed works
        const activeWorks = works.filter(work => 
          work.estado !== 'COMPLETADO' && work.estado !== 'CANCELADO'
        );
        setAvailableWorks(activeWorks);
        setLoadingWork(false);
      } catch (err) {
        setError('Error al cargar los trabajos disponibles: ' + err.message);
        setLoadingWork(false);
      }
    };
    
    fetchAvailableWorks();
  }, [user, workId]);
  
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...detailsData];
    newDetails[index] = {
      ...newDetails[index],
      [field]: value
    };
    setDetailsData(newDetails);
  };
  
  const addDetailField = () => {
    setDetailsData([
      ...detailsData,
      {
        tipo_diagnostico: 'MECANICO',
        descripcion: '',
        severidad: 'MEDIA'
      }
    ]);
  };
  
  const removeDetailField = (index) => {
    if (detailsData.length === 1) return;
    
    const newDetails = detailsData.filter((_, i) => i !== index);
    setDetailsData(newDetails);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleWorkSelection = (workId) => {
    if (!workId) {
      setWork(null);
      setFormData(prev => ({ ...prev, id_asignacion_trabajo: '' }));
      return;
    }
    
    setFormData(prev => ({ ...prev, id_asignacion_trabajo: workId }));
    const selectedWork = availableWorks.find(w => w.id_asignacion.toString() === workId);
    if (selectedWork) {
      setWork(selectedWork);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_asignacion_trabajo || !formData.observaciones_generales) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Check if all details have a description
    if (detailsData.some(detail => !detail.descripcion.trim())) {
      setError('Por favor complete la descripción en todos los detalles del diagnóstico');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First create the main diagnostic
      const diagnosticResponse = await serviceSpecialistService.addDiagnostic(formData);
      const diagnosticId = diagnosticResponse.diagnostic.id_diagnostico_especialista;
      
      // Then add all the details
      for (const detail of detailsData) {
        await serviceSpecialistService.addDiagnosticDetail(diagnosticId, detail);
      }
      
      setSuccess(true);
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate(`/specialist/diagnostics`);
      }, 1500);
      
    } catch (err) {
      setError('Error al guardar el diagnóstico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Crear Diagnóstico</h1>
        <Link 
          to={formData.id_asignacion_trabajo ? `/specialist/works/${formData.id_asignacion_trabajo}` : '/specialist/diagnostics'} 
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
          Diagnóstico guardado exitosamente. Redireccionando...
        </Alert>
      )}
      
      {workId && work && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Información del Trabajo</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">Tipo de Trabajo:</dt>
                  <dd className="col-sm-8">{work.TipoMantenimiento?.nombre_tipo}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">Vehículo:</dt>
                  <dd className="col-sm-8">
                    {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo} ({work.RegistroServicioVehiculo?.Vehiculo?.placa})
                  </dd>
                </dl>
              </Col>
            </Row>
            <div>
              <strong>Descripción del problema:</strong>
              <p>{work.RegistroServicioVehiculo?.descripcion_problema}</p>
            </div>
          </Card.Body>
        </Card>
      )}
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Formulario de Diagnóstico</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {!workId && (
              <Form.Group className="mb-3">
                <Form.Label>Trabajo a diagnosticar</Form.Label>
                <Form.Select
                  name="id_asignacion_trabajo"
                  value={formData.id_asignacion_trabajo}
                  onChange={(e) => handleWorkSelection(e.target.value)}
                  disabled={loading || loadingWork}
                  required
                >
                  <option value="">Seleccione un trabajo</option>
                  {availableWorks.map(work => (
                    <option key={work.id_asignacion} value={work.id_asignacion}>
                      #{work.id_asignacion} - {work.TipoMantenimiento?.nombre_tipo} - 
                      {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                    </option>
                  ))}
                </Form.Select>
                {loadingWork && (
                  <div className="d-flex align-items-center mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span className="small text-muted">Cargando trabajos disponibles...</span>
                  </div>
                )}
                {availableWorks.length === 0 && !loadingWork && (
                  <div className="text-muted mt-2 small">
                    <i className="bi bi-info-circle me-1"></i>
                    No hay trabajos activos disponibles para diagnóstico
                  </div>
                )}
              </Form.Group>
            )}
            
            {/* Display work details if selected but not from URL parameter */}
            {!workId && work && (
              <Card className="mb-4 bg-light">
                <Card.Body>
                  <h6 className="border-bottom pb-2">Detalles del Trabajo Seleccionado</h6>
                  <Row className="mb-2">
                    <Col md={6}>
                      <strong>Vehículo:</strong> {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                    </Col>
                    <Col md={6}>
                      <strong>Placa:</strong> {work.RegistroServicioVehiculo?.Vehiculo?.placa}
                    </Col>
                  </Row>
                  <div>
                    <strong>Problema reportado:</strong>
                    <p className="mb-0 mt-1">{work.RegistroServicioVehiculo?.descripcion_problema}</p>
                  </div>
                </Card.Body>
              </Card>
            )}
            
            <Form.Group className="mb-4">
              <Form.Label>Observaciones Generales</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="observaciones_generales"
                value={formData.observaciones_generales}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Ingrese las observaciones generales del diagnóstico"
              />
            </Form.Group>
            
            <h5 className="border-bottom pb-2 mb-3">Detalles del Diagnóstico</h5>
            
            {detailsData.map((detail, index) => (
              <div key={index} className="border rounded p-3 mb-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Diagnóstico</Form.Label>
                      <Form.Select
                        value={detail.tipo_diagnostico}
                        onChange={(e) => handleDetailChange(index, 'tipo_diagnostico', e.target.value)}
                        disabled={loading}
                      >
                        <option value="MECANICO">Mecánico</option>
                        <option value="ELECTRICO">Eléctrico</option>
                        <option value="ELECTRONICO">Electrónico</option>
                        <option value="HIDRAULICO">Hidráulico</option>
                        <option value="CARROCERIA">Carrocería</option>
                        <option value="OTRO">Otro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Severidad</Form.Label>
                      <Form.Select
                        value={detail.severidad}
                        onChange={(e) => handleDetailChange(index, 'severidad', e.target.value)}
                        disabled={loading}
                      >
                        <option value="LEVE">Leve</option>
                        <option value="MODERADO">Moderado</option>
                        <option value="SEVERO">Severo</option>
                        <option value="CRITICO">Crítico</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={detail.descripcion}
                    onChange={(e) => handleDetailChange(index, 'descripcion', e.target.value)}
                    disabled={loading}
                    required
                    placeholder="Descripción detallada del diagnóstico"
                  />
                </Form.Group>
                
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeDetailField(index)}
                    disabled={detailsData.length === 1 || loading}
                  >
                    <i className="bi bi-trash me-1"></i> Eliminar
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="mb-4">
              <Button 
                variant="outline-primary" 
                onClick={addDetailField}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-1"></i> Agregar Detalle
              </Button>
            </div>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/specialist/diagnostics')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Diagnóstico'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
