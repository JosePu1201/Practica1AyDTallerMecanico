import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Form, Modal, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function MaintenanceTypes() {
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_tipo: '',
    descripcion: '',
    precio_base: '',
    tiempo_estimado: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState([]);

  useEffect(() => {
    fetchMaintenanceTypes();
  }, []);

  useEffect(() => {
    // Filter types based on search term
    const filtered = maintenanceTypes.filter(type => 
      type.nombre_tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTypes(filtered);
  }, [maintenanceTypes, searchTerm]);

  const fetchMaintenanceTypes = async () => {
    try {
      setLoading(true);
      const data = await serviceManagementService.getMaintenanceTypes();
      setMaintenanceTypes(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los tipos de mantenimiento');
      setLoading(false);
      console.error('Error loading maintenance types:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.nombre_tipo || !formData.precio_base) {
        alert('Por favor complete los campos requeridos');
        return;
      }
      
      // Format data
      const dataToSubmit = {
        ...formData,
        precio_base: parseFloat(formData.precio_base),
        tiempo_estimado: parseInt(formData.tiempo_estimado) || 0
      };
      
      await serviceManagementService.addMaintenanceType(dataToSubmit);
      
      // Refresh list
      fetchMaintenanceTypes();
      
      // Reset form and close modal
      setFormData({
        nombre_tipo: '',
        descripcion: '',
        precio_base: '',
        tiempo_estimado: ''
      });
      setShowModal(false);
      
    } catch (err) {
      alert(`Error al crear el tipo de mantenimiento: ${err.message}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tipos de Mantenimiento</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Tipo de Mantenimiento
        </Button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control 
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando tipos de mantenimiento...</p>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-exclamation-circle display-4 text-muted"></i>
              <h3 className="mt-3 text-muted">No se encontraron tipos de mantenimiento</h3>
              {searchTerm && (
                <p className="text-muted">
                  No hay resultados para "{searchTerm}"
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover bordered>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio Base</th>
                    <th>Tiempo Estimado (horas)</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map(type => (
                    <tr key={type.id_tipo_trabajo}>
                      <td>{type.id_tipo_trabajo}</td>
                      <td>{type.nombre_tipo}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {type.descripcion || 'Sin descripción'}
                        </div>
                      </td>
                      <td>Q{type.precio_base}</td>
                      <td>{type.tiempo_estimado || 'No especificado'}</td>
                      <td>
                        <span className={`badge bg-${type.estado === 'ACTIVO' ? 'success' : 'danger'}`}>
                          {type.estado}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button size="sm" variant="outline-primary">
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button size="sm" variant="outline-danger">
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal for adding new maintenance type */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Tipo de Mantenimiento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre_tipo"
                value={formData.nombre_tipo}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio Base (Q)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="precio_base"
                    value={formData.precio_base}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tiempo Estimado (horas)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="tiempo_estimado"
                    value={formData.tiempo_estimado}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
