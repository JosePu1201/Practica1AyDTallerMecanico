import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function SolutionProposalForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // result id
  
  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [test, setTest] = useState(null);
  
  const [formData, setFormData] = useState({
    id_resultado_prueba: id,
    descripcion_solucion: '',
    costo_estimado: '',
    tiempo_estimado: '',
    prioridad: 'media'
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
  
  // Fetch test and result details
  useEffect(() => {
    const fetchResultDetails = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoadingResult(true);
        // First get all tests
        const tests = await serviceSpecialistService.getTechnicalTestsBySpecialist(user.id_usuario);
        
        // Find the test that contains the result we need
        let foundTest = null;
        let foundResult = null;
        
        for (const t of tests) {
          if (t.ResultadoPruebaTecnicas && t.ResultadoPruebaTecnicas.length > 0) {
            for (const r of t.ResultadoPruebaTecnicas) {
              if (r.id_resultado_prueba.toString() === id) {
                foundTest = t;
                foundResult = r;
                break;
              }
            }
          }
          if (foundTest) break;
        }
        
        if (!foundTest || !foundResult) {
          setError('Resultado de prueba no encontrado o no tiene acceso');
          setLoadingResult(false);
          return;
        }
        
        setTest(foundTest);
        setTestResult(foundResult);
        setLoadingResult(false);
      } catch (err) {
        setError('Error al cargar los detalles del resultado: ' + err.message);
        setLoadingResult(false);
      }
    };
    
    if (id) {
      fetchResultDetails();
    }
  }, [id, user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion_solucion.trim()) {
      setError('Por favor ingrese una descripción de la solución');
      return;
    }
    
    if (!formData.costo_estimado || isNaN(formData.costo_estimado)) {
      setError('Por favor ingrese un costo estimado válido');
      return;
    }
    
    if (!formData.tiempo_estimado || isNaN(formData.tiempo_estimado)) {
      setError('Por favor ingrese un tiempo estimado válido');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceSpecialistService.addSolutionProposal(formData);
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/specialist/tests');
      }, 2000);
      
    } catch (err) {
      setError('Error al registrar la solución: ' + err.message);
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loadingResult) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando detalles del resultado...</p>
      </div>
    );
  }
  
  if (error && !success) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/specialist/tests')}>
            Volver a la lista de pruebas
          </Button>
        </div>
      </Alert>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Proponer Solución</h1>
        <Link to="/specialist/tests" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i> Volver
        </Link>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading>Solución Registrada</Alert.Heading>
          <p>La solución propuesta se ha registrado correctamente. Redireccionando...</p>
        </Alert>
      )}
      
      {test && testResult && (
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Información de la Prueba y Resultado</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">Prueba ID:</dt>
                  <dd className="col-sm-8">#{test.id_prueba_tecnica}</dd>
                  
                  <dt className="col-sm-4">Fecha:</dt>
                  <dd className="col-sm-8">{formatDate(test.fecha_prueba)}</dd>
                  
                  <dt className="col-sm-4">Vehículo:</dt>
                  <dd className="col-sm-8">
                    {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                    {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo} {' '}
                    ({test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa})
                  </dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">Resultado ID:</dt>
                  <dd className="col-sm-8">#{testResult.id_resultado_prueba}</dd>
                  
                  <dt className="col-sm-4">Evaluación:</dt>
                  <dd className="col-sm-8">
                    <span className={`badge ${testResult.resultado_satisfactorio ? 'bg-success' : 'bg-danger'}`}>
                      {testResult.resultado_satisfactorio ? 'Satisfactorio' : 'No satisfactorio'}
                    </span>
                  </dd>
                  
                  <dt className="col-sm-4">Trabajo:</dt>
                  <dd className="col-sm-8">{test.AsignacionTrabajo?.TipoMantenimiento?.nombre_tipo}</dd>
                </dl>
              </Col>
            </Row>
            
            <div className="mt-3">
              <h6>Descripción de la Prueba</h6>
              <p className="bg-light p-3 rounded mb-3">{test.descripcion_prueba_tecnica}</p>
              
              <h6>Resultado de la Prueba</h6>
              <p className="bg-light p-3 rounded">{testResult.descripcion_resultado}</p>
            </div>
          </Card.Body>
        </Card>
      )}
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Formulario de Solución Propuesta</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Descripción de la Solución</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="descripcion_solucion"
                value={formData.descripcion_solucion}
                onChange={handleChange}
                placeholder="Describa detalladamente la solución propuesta"
                disabled={loading}
                required
              />
              <Form.Text className="text-muted">
                Incluya métodos, repuestos necesarios y procedimientos a realizar.
              </Form.Text>
            </Form.Group>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Costo Estimado (Q)</Form.Label>
                  <Form.Control
                    type="number"
                    name="costo_estimado"
                    value={formData.costo_estimado}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tiempo Estimado (horas)</Form.Label>
                  <Form.Control
                    type="number"
                    name="tiempo_estimado"
                    value={formData.tiempo_estimado}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Prioridad</Form.Label>
              <Form.Select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Seleccione la prioridad con la que se debería implementar esta solución.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/specialist/tests')}
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
                  'Registrar Solución'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
