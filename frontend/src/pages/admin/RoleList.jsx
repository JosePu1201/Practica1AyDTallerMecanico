import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { userService } from '../../services/adminService'; 

export default function RoleList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentRole, setCurrentRole] = useState(null);
  const [formData, setFormData] = useState({
    nombre_rol: '',
    descripcion: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  useEffect(() => {
    fetchRoles();
  }, []);
  
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllRoles();
      setRoles(response);
      setError(null);
    } catch (err) {
      setError('Error al cargar los roles: ' + (err.response?.data?.error || err.message));
      toast.error('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };
  
  const openCreateModal = () => {
    setFormData({
      nombre_rol: '',
      descripcion: ''
    });
    setFormErrors({});
    setModalMode('create');
    setCurrentRole(null);
    setShowModal(true);
  };
  
  const openEditModal = (role) => {
    setFormData({
      nombre_rol: role.nombre_rol,
      descripcion: role.descripcion || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setCurrentRole(role);
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
    
    if (!formData.nombre_rol.trim()) {
      errors.nombre_rol = 'El nombre del rol es obligatorio';
    } else if (formData.nombre_rol.length < 3) {
      errors.nombre_rol = 'El nombre del rol debe tener al menos 3 caracteres';
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
    
    try {
      if (modalMode === 'create') {
        await userService.createRole(formData);
        toast.success('Rol creado con éxito');
      } else {
        await axios.put(`/api/management/roles/${currentRole.id_rol}`, formData);
        toast.success('Rol actualizado con éxito');
      }
      
      fetchRoles();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ha ocurrido un error';
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleDelete = async (id, roleName) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el rol "${roleName}"? Esta acción podría afectar a los usuarios que tienen este rol asignado.`)) {
      try {
        await axios.delete(`/api/management/roles/${id}`);
        toast.success('Rol eliminado con éxito');
        fetchRoles();
      } catch (err) {
        toast.error('Error al eliminar el rol: ' + (err.response?.data?.error || err.message));
      }
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
        <h1>Gestión de Roles</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <i className="bi bi-plus-circle me-1"></i> Nuevo Rol
        </Button>
      </div>
      
      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Rol</th>
                <th>Descripción</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No hay roles disponibles</td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role.id_rol}>
                    <td>{role.id_rol}</td>
                    <td>{role.nombre_rol}</td>
                    <td>{role.descripcion || 'Sin descripción'}</td>
                    <td>
                      {new Date(role.fecha_creacion).toLocaleDateString('es-GT')}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(role)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(role.id_rol, role.nombre_rol)}
                        // Disable deletion of system roles (usually IDs 1-3)
                        disabled={role.id_rol <= 3}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Modal for Create/Edit Role */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Rol <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre_rol"
                value={formData.nombre_rol}
                onChange={handleChange}
                isInvalid={!!formErrors.nombre_rol}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.nombre_rol}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción de las funciones y permisos de este rol"
              />
            </Form.Group>
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
                {modalMode === 'create' ? 'Creando...' : 'Guardando...'}
              </>
            ) : (
              modalMode === 'create' ? 'Crear Rol' : 'Guardar Cambios'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
