import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { userService } from '../../services/adminService';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dpi: '',
    fecha_nacimiento: '',
    direccion: '',
    correo: '',
    telefono: '',
    nombre_usuario: '',
    contrasena: '',
    confirmar_contrasena: '',
    id_rol: ''
  });
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await userService.getAllRoles();
        setRoles(response);
      } catch (err) {
        toast.error('Error al cargar los roles');
        console.error('Error fetching roles:', err);
      }
    };
    
    fetchRoles();
    
    if (isEditMode) {
      const fetchUserData = async () => {
        try {
          setLoadingData(true);
          const response = await userService.getUserById(id);
          const userData = response;
          
          // Map API response to form fields
          setFormData({
            nombre: userData.Persona?.nombre || '',
            apellido: userData.Persona?.apellido || '',
            dpi: userData.Persona?.dpi || '',
            fecha_nacimiento: userData.Persona?.fecha_nacimiento ? new Date(userData.Persona.fecha_nacimiento).toISOString().split('T')[0] : '',
            direccion: userData.Persona?.direccion || '',
            correo: getContact(userData)?.correo || '',
            telefono: getContact(userData)?.telefono || '',
            nombre_usuario: userData.nombre_usuario || '',
            contrasena: '',  // Don't populate password fields for security
            confirmar_contrasena: '',
            id_rol: userData.id_rol || ''
          });
        } catch (err) {
          toast.error('Error al cargar datos del usuario');
          console.error('Error fetching user data:', err);
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchUserData();
    }
  }, [id, isEditMode]);
  
   const getContact = (userData) => {
    if (!userData.Persona) return null;
    return Array.isArray(userData.Persona.ContactoPersonas) && userData.Persona.ContactoPersonas.length > 0
      ? userData.Persona.ContactoPersonas[0]
      : null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.apellido) newErrors.apellido = 'El apellido es obligatorio';
    
    if (!formData.dpi) {
      newErrors.dpi = 'El DPI es obligatorio';
    } else if (!/^\d{13}$/.test(formData.dpi)) {
      newErrors.dpi = 'El DPI debe tener 13 dígitos';
    }
    
    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) newErrors.fecha_nacimiento = 'Debe ser mayor de 18 años';
    }
    
    if (!formData.nombre_usuario) {
      newErrors.nombre_usuario = 'El nombre de usuario es obligatorio';
    } else if (formData.nombre_usuario.length < 4) {
      newErrors.nombre_usuario = 'El nombre de usuario debe tener al menos 4 caracteres';
    }
    
    if (!isEditMode || formData.contrasena) {
      if (!formData.contrasena) {
        newErrors.contrasena = 'La contraseña es obligatoria';
      } else if (formData.contrasena.length < 6) {
        newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.contrasena !== formData.confirmar_contrasena) {
        newErrors.confirmar_contrasena = 'Las contraseñas no coinciden';
      }
    }
    
    if (!formData.correo) {
      newErrors.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }
    
    if (formData.telefono && !/^\d{8}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener 8 dígitos';
    }
    
    if (!formData.id_rol) newErrors.id_rol = 'El rol es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores del formulario');
      return;
    }
    
    setLoading(true);
    
    try {
      // Remove confirmar_contrasena before sending to API
      const { confirmar_contrasena, ...dataToSend } = formData;
      
      if (isEditMode) {
        // If password is empty in edit mode, remove it from the request
        if (!dataToSend.contrasena) {
          const { contrasena, ...dataWithoutPassword } = dataToSend;
          await userService.updateUser(id, dataToSend);
        } else {
          await userService.updateUser(id, dataToSend);
        }
        toast.success('Usuario actualizado con éxito');
      } else {
        await userService.createUser(dataToSend);
        toast.success('Usuario creado con éxito');
      }
      
      navigate('/admin/usuarios');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ha ocurrido un error';
      toast.error(errorMsg);
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
        <Link to="/admin/usuarios" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i> Volver
        </Link>
      </div>
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3">Datos Personales</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    isInvalid={!!errors.nombre}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    isInvalid={!!errors.apellido}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.apellido}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DPI <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="dpi"
                    value={formData.dpi}
                    onChange={handleChange}
                    isInvalid={!!errors.dpi}
                    readOnly={isEditMode}  // DPI shouldn't be editable once set
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.dpi}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Nacimiento</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    isInvalid={!!errors.fecha_nacimiento}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fecha_nacimiento}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
              />
            </Form.Group>
            
            <h5 className="mb-3">Información de Contacto</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    isInvalid={!!errors.correo}
                    readOnly={isEditMode}  // Email shouldn't be editable once set
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.correo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    isInvalid={!!errors.telefono}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.telefono}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mb-3">Información de Acceso</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Usuario <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre_usuario"
                    value={formData.nombre_usuario}
                    onChange={handleChange}
                    isInvalid={!!errors.nombre_usuario}
                    readOnly={isEditMode}  // Username shouldn't be editable once set
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre_usuario}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Rol <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="id_rol"
                    value={formData.id_rol}
                    onChange={handleChange}
                    isInvalid={!!errors.id_rol}
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map(rol => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre_rol}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.id_rol}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Nueva Contraseña' : 'Contraseña'} 
                    {!isEditMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    isInvalid={!!errors.contrasena}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.contrasena}
                  </Form.Control.Feedback>
                  {isEditMode && (
                    <Form.Text className="text-muted">
                      Dejar en blanco para mantener la contraseña actual
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Confirmar Contraseña
                    {!isEditMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmar_contrasena"
                    value={formData.confirmar_contrasena}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmar_contrasena}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmar_contrasena}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" as={Link} to="/admin/usuarios">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    {isEditMode ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  isEditMode ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
