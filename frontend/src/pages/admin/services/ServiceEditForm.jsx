import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function ServiceEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    descripcion_problema: '',
    estado: '',
    fecha_estimada_finalizacion: '',
    observaciones_iniciales: '',
    prioridad: ''
  });
  
  // Fetch the service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const services = await serviceManagementService.getServices();
        const service = services.find(s => s.id_registro.toString() === id);
        
        if (!service) {
          setError('Servicio no encontrado');
          setLoading(false);
          return;
        }
        
        // Format date for form input (YYYY-MM-DD)
        const formattedDate = service.fecha_estimada_finalizacion 
          ? new Date(service.fecha_estimada_finalizacion).toISOString().split('T')[0]
          : '';
        
        setFormData({
          descripcion_problema: service.descripcion_problema || '',
          estado: service.estado || 'PENDIENTE',
          fecha_estimada_finalizacion: formattedDate,
          observaciones_iniciales: service.observaciones_iniciales || '',
          prioridad: service.prioridad || 'MEDIA'
        });
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el servicio: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceManagementService.updateService(id, formData);
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate(`/admin/services/detail/${id}`);
      }, 1500);
      
    } catch (err) {
      setError('Error al actualizar el servicio: ' + err.message);
      setLoading(false);
    }
  };

  if (loading && !formData.descripcion_problema) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando información del servicio...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Editar Servicio #{id}</h1>
        <div className="d-flex gap-2">
          <Link to={`/admin/services/detail/${id}`} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Link>
        </div>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Servicio actualizado exitosamente. Redirigiendo...
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="estado">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="prioridad">
                  <Form.Label>Prioridad</Form.Label>
                  <Form.Select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="fecha_estimada_finalizacion">
                  <Form.Label>Fecha Estimada de Finalización</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_estimada_finalizacion"
                    value={formData.fecha_estimada_finalizacion}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="descripcion_problema">
                  <Form.Label>Descripción del Problema</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="descripcion_problema"
                    value={formData.descripcion_problema}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="observaciones_iniciales">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones_iniciales"
                    value={formData.observaciones_iniciales}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                as={Link} 
                to={`/admin/services/detail/${id}`}
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
                    <Spinner animation="border" size="sm" className="me-2" />
                    Actualizando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
