import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function RegisterService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [formData, setFormData] = useState({
    id_vehiculo: '',
    descripcion_problema: '',
    estado: 'PENDIENTE',
    fecha_estimada_finalizacion: '',
    observaciones_iniciales: '',
    prioridad: 'MEDIA',
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const vehiclesData = await serviceManagementService.getVehiclesWithClient();
        setVehicles(vehiclesData);
      } catch (err) {
        setError('Error al cargar los vehículos: ' + err.message);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.id_vehiculo) return 'Seleccione un vehículo';
    if (!formData.descripcion_problema) return 'Ingrese una descripción del problema';
    if (!formData.fecha_estimada_finalizacion) return 'Seleccione una fecha estimada de finalización';
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
      
      await serviceManagementService.registerServiceVehicle(formData);
      
      setSuccess(true);
      // Reset form
      setFormData({
        id_vehiculo: '',
        descripcion_problema: '',
        estado: 'PENDIENTE',
        fecha_estimada_finalizacion: '',
        observaciones_iniciales: '',
        prioridad: 'MEDIA',
      });
      
      // Redirect after success
      setTimeout(() => {
        navigate('/admin/services/list');
      }, 1500);
      
    } catch (err) {
      setError('Error al registrar el servicio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Registrar Nuevo Servicio</h1>
        <Link to="/admin/services/list" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la lista
        </Link>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Servicio registrado exitosamente. Redirigiendo...
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
                <Form.Group controlId="id_vehiculo">
                  <Form.Label>Vehículo</Form.Label>
                  <Form.Select
                    name="id_vehiculo"
                    value={formData.id_vehiculo}
                    onChange={handleChange}
                    disabled={loadingVehicles || loading}
                    required
                  >
                    <option value="">Seleccione un vehículo</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id_vehiculo} value={vehicle.id_vehiculo}>
                        {vehicle.marca} {vehicle.modelo} - {vehicle.placa} ({vehicle.Usuario.Persona.nombre} {vehicle.Usuario.Persona.apellido})
                      </option>
                    ))}
                  </Form.Select>
                  {loadingVehicles && (
                    <div className="text-center mt-2">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2">Cargando vehículos...</span>
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group controlId="estado">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="fecha_estimada_finalizacion">
                  <Form.Label>Fecha Estimada de Finalización</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_estimada_finalizacion"
                    value={formData.fecha_estimada_finalizacion}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    min={new Date().toISOString().split('T')[0]} // No dates in the past
                  />
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
                <Form.Group controlId="descripcion_problema">
                  <Form.Label>Descripción del Problema</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="descripcion_problema"
                    value={formData.descripcion_problema}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="observaciones_iniciales">
                  <Form.Label>Observaciones Iniciales (Opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="observaciones_iniciales"
                    value={formData.observaciones_iniciales}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" as={Link} to="/admin/services/list" disabled={loading}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Servicio'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
