import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function TechnicalTestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workId = queryParams.get('workId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [work, setWork] = useState(null);
  const [loadingWork, setLoadingWork] = useState(workId ? true : false);
  const [works, setWorks] = useState([]);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    id_especialista: '',
    id_asignacion_trabajo: workId || '',
    descripcion_prueba_tecnica: ''
  });
  
  // Get user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const userData = JSON.parse(s);
        setUser(userData);
        setFormData(prevState => ({
          ...prevState,
          id_especialista: userData.id_usuario
        }));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  
  useEffect(() => {
    const fetchWorks = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        const response = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        setWorks(response.filter(work => work.estado !== 'COMPLETADO'));
        
        if (workId) {
          const currentWork = response.find(w => w.id_asignacion.toString() === workId);
          if (currentWork) {
            setWork(currentWork);
          }
        }
        
        setLoadingWork(false);
      } catch (err) {
        setError('Error al cargar los trabajos: ' + err.message);
        setLoadingWork(false);
      }
    };
    
    fetchWorks();
  }, [user, workId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'id_asignacion_trabajo' && value) {
      // Update selected work when changing the dropdown
      const selectedWork = works.find(w => w.id_asignacion.toString() === value);
      setWork(selectedWork);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_asignacion_trabajo) {
      setError('Debe seleccionar un trabajo');
      return;
    }
    
    if (!formData.descripcion_prueba_tecnica) {
      setError('Debe ingresar una descripción de la prueba');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceSpecialistService.addTechnicalTest(formData);
      
      setSuccess(true);
      setLoading(false);
      
      // Reset form or redirect
      setTimeout(() => {
        navigate('/specialist/tests');
      }, 2000);
      
    } catch (err) {
      setError('Error al crear la prueba técnica: ' + err.message);
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Nueva Prueba Técnica</h1>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading>Prueba Técnica Creada</Alert.Heading>
          <p>La prueba técnica se ha creado correctamente. Redireccionando...</p>
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Formulario de Prueba Técnica</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Trabajo para Prueba Técnica</Form.Label>
              <Form.Select
                name="id_asignacion_trabajo"
                value={formData.id_asignacion_trabajo}
                onChange={handleChange}
                disabled={loading || loadingWork || !!workId}
                required
              >
                <option value="">Seleccione un trabajo</option>
                {works.map(w => (
                  <option key={w.id_asignacion} value={w.id_asignacion}>
                    #{w.id_asignacion} - {w.TipoMantenimiento?.nombre_tipo} - 
                    {w.RegistroServicioVehiculo?.Vehiculo?.marca} {w.RegistroServicioVehiculo?.Vehiculo?.modelo}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {work && (
              <div className="bg-light p-3 rounded mb-4">
                <Row>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Vehículo:</dt>
                      <dd className="col-sm-8">
                        {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </dd>
                      
                      <dt className="col-sm-4">Placa:</dt>
                      <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.placa}</dd>
                    </dl>
                  </Col>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Tipo de trabajo:</dt>
                      <dd className="col-sm-8">{work.TipoMantenimiento?.nombre_tipo}</dd>
                      
                      <dt className="col-sm-4">Problema:</dt>
                      <dd className="col-sm-8" style={{ maxHeight: '50px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {work.RegistroServicioVehiculo?.descripcion_problema}
                      </dd>
                    </dl>
                  </Col>
                </Row>
              </div>
            )}
            
            <Form.Group className="mb-4">
              <Form.Label>Descripción de la Prueba Técnica</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="descripcion_prueba_tecnica"
                value={formData.descripcion_prueba_tecnica}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Describa detalladamente la prueba técnica que se realizará"
              />
              <Form.Text className="text-muted">
                Incluya el propósito de la prueba, los parámetros a medir y los resultados esperados.
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
                  'Crear Prueba Técnica'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
