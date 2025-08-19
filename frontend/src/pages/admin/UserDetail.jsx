import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Tab, Tabs } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
//import axios from 'axios';
import { userService } from '../../services/adminService';
import { toast } from 'react-toastify';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialistInfo, setSpecialistInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  
  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserById(id);
        setUser(data);


        setError(null);
      } catch (err) {
        setError('Error al cargar los detalles del usuario: ' + (err.response?.data?.error || err.message));
        toast.error('Error al cargar los detalles del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetail();
  }, [id]);
  
  const handleDelete = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.deleteUser(id);
        toast.success('Usuario eliminado con éxito');
        navigate('/admin/usuarios');
      } catch (err) {
        toast.error('Error al eliminar el usuario: ' + (err.response?.data?.error || err.message));
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  const getUserStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVO':
        return <Badge bg="success">Activo</Badge>;
      case 'INACTIVO':
        return <Badge bg="secondary">Inactivo</Badge>;
      case 'BLOQUEADO':
        return <Badge bg="danger">Bloqueado</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };
  
  // Helper function to get the first contact
  const getContact = () => {
    if (!user.Persona) return null;
    return Array.isArray(user.Persona.ContactoPersonas) && user.Persona.ContactoPersonas.length > 0
      ? user.Persona.ContactoPersonas[0]
      : null;
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
  
  if (!user) {
    return (
      <div className="alert alert-warning" role="alert">
        Usuario no encontrado
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detalles del Usuario</h1>
        <div>
          <Link to="/admin/usuarios" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </Link>
          <Link to={`/admin/usuarios/editar/${id}`} className="btn btn-primary me-2">
            <i className="bi bi-pencil me-1"></i> Editar
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            <i className="bi bi-trash me-1"></i> Eliminar
          </Button>
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-md-flex align-items-center mb-4">
            <div className="user-avatar me-4 mb-3 mb-md-0">
              <div className="avatar-circle bg-primary text-white">
                {user.nombre_usuario.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="mb-1">
                {user.Persona?.nombre} {user.Persona?.apellido}
              </h3>
              <div>
                <Badge bg="info" className="me-2">
                  {user.Rol?.nombre_rol || 'Sin rol'}
                </Badge>
                {getUserStatusBadge(user.estado)}
              </div>
            </div>
          </div>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            <Tab eventKey="personal" title="Información Personal">
              <Row>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Nombre completo</dt>
                    <dd className="col-sm-8">
                      {user.Persona?.nombre} {user.Persona?.apellido}
                    </dd>
                    
                    <dt className="col-sm-4">DPI</dt>
                    <dd className="col-sm-8">{user.Persona?.dpi || 'No disponible'}</dd>

                    <dt className="col-sm-4">Fecha de nacimiento</dt>
                    <dd className="col-sm-8">
                      {user.Persona?.fecha_nacimiento 
                        ? formatDate(user.Persona.fecha_nacimiento) 
                        : 'No disponible'}
                    </dd>
                    
                    <dt className="col-sm-4">Dirección</dt>
                    <dd className="col-sm-8">{user.Persona?.direccion || 'No disponible'}</dd>
                  </dl>
                </Col>
                
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Correo electrónico</dt>
                    <dd className="col-sm-8">
                      {getContact()?.correo || 'No disponible'}
                    </dd>
                    
                    <dt className="col-sm-4">Teléfono</dt>
                    <dd className="col-sm-8">
                      {getContact()?.telefono || 'No disponible'}
                    </dd>
                    
                    <dt className="col-sm-4">Fecha de creación</dt>
                    <dd className="col-sm-8">{formatDate(user.fecha_creacion)}</dd>
                    
                    <dt className="col-sm-4">Último acceso</dt>
                    <dd className="col-sm-8">
                      {user.ultimo_acceso ? formatDate(user.ultimo_acceso) : 'Nunca'}
                    </dd>
                  </dl>
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="account" title="Información de Cuenta">
              <Row>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">ID de Usuario</dt>
                    <dd className="col-sm-8">{user.id_usuario}</dd>
                    
                    <dt className="col-sm-4">Nombre de usuario</dt>
                    <dd className="col-sm-8">{user.nombre_usuario}</dd>
                    
                    <dt className="col-sm-4">Rol</dt>
                    <dd className="col-sm-8">{user.Rol?.nombre_rol || 'Sin rol'}</dd>
                    
                    <dt className="col-sm-4">Estado</dt>
                    <dd className="col-sm-8">{getUserStatusBadge(user.estado)}</dd>
                  </dl>
                </Col>
                
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Fecha de creación</dt>
                    <dd className="col-sm-8">{formatDate(user.fecha_creacion)}</dd>
                    
                    <dt className="col-sm-4">Última modificación</dt>
                    <dd className="col-sm-8">{formatDate(user.fecha_modificacion)}</dd>
                    
                    <dt className="col-sm-4">Último acceso</dt>
                    <dd className="col-sm-8">
                      {user.ultimo_acceso ? formatDate(user.ultimo_acceso) : 'Nunca'}
                    </dd>
                  </dl>
                </Col>
              </Row>
            </Tab>
            
            {user.id_rol === 4 && (
              <Tab eventKey="specialist" title="Información de Especialista">
                {specialistInfo ? (
                  <Row>
                    <Col md={6}>
                      <dl className="row">
                        <dt className="col-sm-4">Tipo de técnico</dt>
                        <dd className="col-sm-8">
                          {specialistInfo.tipoTecnico?.nombre || 'No asignado'}
                        </dd>
                        
                        <dt className="col-sm-4">Área de especialidad</dt>
                        <dd className="col-sm-8">
                          {specialistInfo.areaEspecialista?.nombre_area || 'No asignada'}
                        </dd>
                        
                        <dt className="col-sm-4">Descripción del área</dt>
                        <dd className="col-sm-8">
                          {specialistInfo.areaEspecialista?.descripcion || 'Sin descripción'}
                        </dd>
                      </dl>
                    </Col>
                  </Row>
                ) : (
                  <div className="alert alert-info">
                    Este usuario es un especialista pero no tiene información de especialización configurada.
                    <div className="mt-3">
                      <Button variant="primary" size="sm">
                        Configurar especialización
                      </Button>
                    </div>
                  </div>
                )}
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}
