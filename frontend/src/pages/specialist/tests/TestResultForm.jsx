import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function TestResultForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // test id
  
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [test, setTest] = useState(null);
  
  const [formData, setFormData] = useState({
    id_prueba_tecnica: id,
    descripcion_resultado: '',
    resultado_satisfactorio: false
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
  
  // Fetch test details
  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoadingTest(true);
        const tests = await serviceSpecialistService.getTechnicalTestsBySpecialist(user.id_usuario);
        const currentTest = tests.find(t => t.id_prueba_tecnica.toString() === id);
        
        if (!currentTest) {
          setError('Prueba técnica no encontrada o no tiene acceso a esta prueba');
          setLoadingTest(false);
          return;
        }
        
        // Check if test already has results
        if (currentTest.ResultadoPruebaTecnicas && currentTest.ResultadoPruebaTecnicas.length > 0) {
          setError('Esta prueba técnica ya tiene resultados registrados');
          setLoadingTest(false);
          return;
        }
        
        setTest(currentTest);
        setLoadingTest(false);
      } catch (err) {
        setError('Error al cargar los detalles de la prueba: ' + err.message);
        setLoadingTest(false);
      }
    };
    
    if (id) {
      fetchTestDetails();
    }
  }, [id, user]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion_resultado.trim()) {
      setError('Por favor ingrese una descripción del resultado');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceSpecialistService.addTestResult(id, formData);
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/specialist/tests');
      }, 2000);
      
    } catch (err) {
      setError('Error al registrar el resultado: ' + err.message);
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
  
  if (loadingTest) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando detalles de la prueba...</p>
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
        <h1>Registrar Resultado de Prueba</h1>
        <Link to="/specialist/tests" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i> Volver
        </Link>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading>Resultado Registrado</Alert.Heading>
          <p>El resultado de la prueba técnica se ha registrado correctamente. Redireccionando...</p>
        </Alert>
      )}
      
      {test && (
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Información de la Prueba Técnica</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">ID Prueba:</dt>
                  <dd className="col-sm-8">#{test.id_prueba_tecnica}</dd>
                  
                  <dt className="col-sm-4">Fecha:</dt>
                  <dd className="col-sm-8">{formatDate(test.fecha_prueba)}</dd>
                  
                  <dt className="col-sm-4">Trabajo:</dt>
                  <dd className="col-sm-8">{test.AsignacionTrabajo?.TipoMantenimiento?.nombre_tipo}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row">
                  <dt className="col-sm-4">Vehículo:</dt>
                  <dd className="col-sm-8">
                    {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                    {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                  </dd>
                  
                  <dt className="col-sm-4">Placa:</dt>
                  <dd className="col-sm-8">
                    {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                  </dd>
                </dl>
              </Col>
            </Row>
            
            <div className="mt-3">
              <h6>Descripción de la Prueba</h6>
              <p className="bg-light p-3 rounded">{test.descripcion_prueba_tecnica}</p>
            </div>
          </Card.Body>
        </Card>
      )}
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Formulario de Resultado</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Descripción del Resultado</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="descripcion_resultado"
                value={formData.descripcion_resultado}
                onChange={handleChange}
                placeholder="Describa detalladamente los resultados obtenidos en la prueba técnica"
                disabled={loading}
                required
              />
              <Form.Text className="text-muted">
                Incluya mediciones realizadas, observaciones específicas y cualquier anomalía detectada.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                label="Resultado Satisfactorio"
                name="resultado_satisfactorio"
                checked={formData.resultado_satisfactorio}
                onChange={handleChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Marque esta casilla si la prueba técnica tuvo un resultado exitoso o satisfactorio.
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
                  'Guardar Resultado'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
