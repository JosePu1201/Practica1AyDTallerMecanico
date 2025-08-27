import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function CommentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workId = searchParams.get('workId');
  
  const [loading, setLoading] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [assignedWorks, setAssignedWorks] = useState([]);
  
  const [formData, setFormData] = useState({
    id_asignacion_trabajo: workId || '',
    id_especialista: '',
    comentario: '',
    tipo_comentario: 'observación'
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

  // Fetch assigned works for dropdown when user is loaded
  useEffect(() => {
    const fetchAssignedWorks = async () => {
      if (!user?.id_usuario) return;
      
      try {
        setLoadingWorks(true);
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        setAssignedWorks(works);
        setLoadingWorks(false);
      } catch (err) {
        setError('Error al cargar los trabajos asignados: ' + err.message);
        setLoadingWorks(false);
      }
    };
    
    fetchAssignedWorks();
  }, [user]);

  // Validate form and submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.id_asignacion_trabajo || !formData.comentario) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await serviceSpecialistService.addCommentsVehicleSpecialist(formData);
      
      setSuccess(true);
      setFormData({
        ...formData,
        comentario: '',
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate(`/specialist/works/${formData.id_asignacion_trabajo}`);
      }, 1500);
      
    } catch (err) {
      setError('Error al guardar el comentario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Agregar Comentario</h1>
        <Link 
          to={formData.id_asignacion_trabajo ? `/specialist/works/${formData.id_asignacion_trabajo}` : '/specialist/comments'} 
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
          Comentario guardado exitosamente. Redireccionando...
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Formulario de Comentarios</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {!workId && (
              <Form.Group className="mb-3">
                <Form.Label>Trabajo asignado</Form.Label>
                {loadingWorks ? (
                  <div className="d-flex align-items-center mb-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Cargando trabajos asignados...</span>
                  </div>
                ) : (
                  <>
                    <Form.Select
                      name="id_asignacion_trabajo"
                      value={formData.id_asignacion_trabajo}
                      onChange={handleChange}
                      disabled={loading || workId}
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
                        No tiene trabajos asignados.
                      </Form.Text>
                    )}
                  </>
                )}
              </Form.Group>
            )}
            
            {/* Display selected work details if a work is selected */}
            {formData.id_asignacion_trabajo && (
              <div className="selected-work-info bg-light p-3 rounded mb-3">
                {assignedWorks.filter(w => w.id_asignacion.toString() === formData.id_asignacion_trabajo.toString()).map(work => (
                  <div key={work.id_asignacion}>
                    <h6 className="mb-2">Información del trabajo seleccionado</h6>
                    <div className="mb-1">
                      <strong>Vehículo:</strong> {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                    </div>
                    <div className="mb-1">
                      <strong>Placa:</strong> {work.RegistroServicioVehiculo?.Vehiculo?.placa}
                    </div>
                    <div>
                      <strong>Descripción:</strong> {work.descripcion}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo de comentario</Form.Label>
              <Form.Select
                name="tipo_comentario"
                value={formData.tipo_comentario}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="OBSERVACION">Observación</option>
                <option value="RECOMENDACION">Recomendación</option>
                <option value="ADVERTENCIA">Advertencia</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Comentario</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                placeholder="Ingrese su comentario"
                disabled={loading}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                as={Link} 
                to={formData.id_asignacion_trabajo ? `/specialist/works/${formData.id_asignacion_trabajo}` : '/specialist/comments'}
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
                    Guardando...
                  </>
                ) : (
                  'Guardar Comentario'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
