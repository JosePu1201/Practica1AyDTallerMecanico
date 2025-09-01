import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { requestClientAdminService } from '../../../services/requestClientAdminService';
import { serviceManagementService } from '../../../services/serviceManagementService';
import { userService } from '../../../services/adminService';

export default function QuotationsManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [activeTab, setActiveTab] = useState('quoteDetails');
  
  const [formData, setFormData] = useState({
    id_registro_cotizacion: '',
    id_tipo_trabajo: '',
    estado: 'INCLUIDO',
    precio: '',
    descripcion_trabajo: ''
  });

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const parsedUser = JSON.parse(s);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
    
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLoadingClients(true);
      setError(null);
      
      // Fetch maintenance types
      const typesData = await requestClientAdminService.getMaintenanceTypes();
      setMaintenanceTypes(typesData);
      
      // Fetch clients
      try {
        const clientsData = await userService.getAllUsers();
        // Filter only clients (role id 3 is typically for clients)
        const onlyClients = clientsData.filter(u => u.Rol?.nombre_rol === 'CLIENTE');
        setClients(onlyClients);
        setLoadingClients(false);
      } catch (err) {
        console.error('Error loading clients:', err);
        setLoadingClients(false);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos iniciales: ' + err.message);
      setLoading(false);
    }
  };

  const loadClientQuotes = async (clientId) => {
    if (!clientId) {
      setQuotes([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const quotesData = await requestClientAdminService.getPriceServiceQuotes(clientId);
      setQuotes(quotesData);
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las cotizaciones: ' + err.message);
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    loadClientQuotes(clientId);
  };

  const handleAddWorkToQuote = (quote) => {
    setCurrentQuote(quote);
    setFormData({
      id_registro_cotizacion: quote.id_registro_cotizacion,
      id_tipo_trabajo: '',
      estado: 'INCLUIDO',
      precio: '',
      descripcion_trabajo: ''
    });
    setShowModal(true);
    setActiveTab('quoteDetails');
  };

  const handleSendQuote = async (id) => {
    if (!window.confirm('¿Está seguro de enviar esta cotización al cliente? No podrá modificarla después.')) {
      return;
    }
    
    try {
      await requestClientAdminService.sendQuote(id);
      setSuccess('Cotización enviada correctamente');
      
      // Refresh data
      loadClientQuotes(selectedClient);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al enviar la cotización: ' + err.message);
    }
  };

  const handleSubmitAddWork = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.id_tipo_trabajo) {
      setError('Por favor seleccione un tipo de trabajo');
      return;
    }
    
    if (!formData.precio || isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      setError('Por favor ingrese un precio válido');
      return;
    }
    
    if (!formData.descripcion_trabajo) {
      setError('Por favor ingrese una descripción del trabajo');
      return;
    }
    
    try {
      setModalLoading(true);
      
      await requestClientAdminService.addWorkToQuote({
        ...formData,
        precio: parseFloat(formData.precio)
      });
      
      setModalLoading(false);
      setShowModal(false);
      setSuccess('Trabajo agregado correctamente a la cotización');
      
      // Refresh data
      loadClientQuotes(selectedClient);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setModalLoading(false);
      setError('Error al agregar trabajo a la cotización: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If selecting maintenance type, set price from selected type
    if (name === 'id_tipo_trabajo') {
      const selectedType = maintenanceTypes.find(type => type.id_tipo_trabajo === parseInt(value));
      if (selectedType) {
        setFormData({ 
          ...formData, 
          [name]: value,
          precio: selectedType.precio_base.toString()
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'ENVIADO':
        return <Badge bg="success">Enviado</Badge>;
      case 'ACEPTADO':
        return <Badge bg="info">Aceptado</Badge>;
      case 'RECHAZADO':
        return <Badge bg="danger">Rechazado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const filteredQuotes = filterStatus === 'TODOS' 
    ? quotes 
    : quotes.filter(quote => quote.estado === filterStatus);

  // Calculate total for a quote
  const calculateQuoteTotal = (quote) => {
    if (!quote.TrabajosCotizacions || quote.TrabajosCotizacions.length === 0) {
      return 0;
    }
    
    return quote.TrabajosCotizacions.reduce((total, work) => total + parseFloat(work.precio || 0), 0);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Cotizaciones</h1>
        <div>
          <Link to="/admin/requests" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver al Dashboard
          </Link>
          <Button variant="primary" onClick={() => loadClientQuotes(selectedClient)}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Seleccionar Cliente</h5>
            <div className="d-flex gap-2">
              <Button 
                variant={filterStatus === 'TODOS' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setFilterStatus('TODOS')}
              >
                Todos
              </Button>
              <Button 
                variant={filterStatus === 'PENDIENTE' ? 'warning' : 'outline-warning'} 
                size="sm"
                onClick={() => setFilterStatus('PENDIENTE')}
              >
                Pendientes
              </Button>
              <Button 
                variant={filterStatus === 'ENVIADO' ? 'success' : 'outline-success'} 
                size="sm"
                onClick={() => setFilterStatus('ENVIADO')}
              >
                Enviadas
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>Cliente</Form.Label>
            <Form.Select
              value={selectedClient}
              onChange={handleClientChange}
              disabled={loadingClients}
            >
              <option value="">Seleccione un cliente</option>
              {clients.map(client => (
                <option key={client.id_usuario} value={client.id_usuario}>
                  {client.Persona?.nombre} {client.Persona?.apellido} ({client.nombre_usuario})
                </option>
              ))}
            </Form.Select>
            {loadingClients && (
              <div className="text-muted mt-2">
                <Spinner size="sm" animation="border" className="me-1" />
                Cargando clientes...
              </div>
            )}
          </Form.Group>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Cotizaciones del Cliente</h5>
        </Card.Header>
        <div className="table-responsive">
          <Table hover bordered>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehículo</th>
                <th>Problema</th>
                <th>Fecha Cotización</th>
                <th>Trabajos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 mb-0">Cargando cotizaciones...</p>
                  </td>
                </tr>
              ) : !selectedClient ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <i className="bi bi-person-fill fs-1 text-muted"></i>
                    <p className="mt-2 mb-0">Por favor seleccione un cliente</p>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="mt-2 mb-0">No hay cotizaciones {filterStatus !== 'TODOS' ? `en estado ${filterStatus.toLowerCase()}` : ''} para este cliente</p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(quote => (
                  <tr key={quote.id_registro_cotizacion}>
                    <td>{quote.id_registro_cotizacion}</td>
                    <td>
                      <div>{quote.Vehiculo?.marca} {quote.Vehiculo?.modelo}</div>
                      <small className="text-muted">{quote.Vehiculo?.placa}</small>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {quote.descripcion_problema}
                      </div>
                    </td>
                    <td>
                      {new Date(quote.fecha_cotizacion).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="text-center">
                      <Badge bg="info">{quote.TrabajosCotizacions?.length || 0}</Badge>
                    </td>
                    <td className="text-end">
                      Q{calculateQuoteTotal(quote).toFixed(2)}
                    </td>
                    <td>{getStatusBadge(quote.estado)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        {(quote.estado === 'PENDIENTE') && (
                          <>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleAddWorkToQuote(quote)}
                              title="Agregar Trabajo"
                            >
                              <i className="bi bi-plus-lg"></i>
                            </Button>
                            {quote.TrabajosCotizacions?.length > 0 && (
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleSendQuote(quote.id_registro_cotizacion)}
                                title="Enviar Cotización"
                              >
                                <i className="bi bi-send"></i>
                              </Button>
                            )}
                          </>
                        )}
                        <Button 
                          variant="info" 
                          size="sm" 
                          onClick={() => {
                            setCurrentQuote(quote);
                            setShowModal(true);
                            setActiveTab('quoteDetails');
                          }}
                          title="Ver Detalles"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
      
      {/* Quote Details / Add Work Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'quoteDetails' ? 'Detalles de Cotización' : 'Agregar Trabajo a Cotización'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentQuote && (
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="quoteDetails" title="Detalles">
                <div className="mb-4">
                  <h5>Información del Vehículo</h5>
                  <Row>
                    <Col md={6}>
                      <dl className="row">
                        <dt className="col-sm-4">Marca</dt>
                        <dd className="col-sm-8">{currentQuote.Vehiculo?.marca}</dd>
                        
                        <dt className="col-sm-4">Modelo</dt>
                        <dd className="col-sm-8">{currentQuote.Vehiculo?.modelo}</dd>
                      </dl>
                    </Col>
                    <Col md={6}>
                      <dl className="row">
                        <dt className="col-sm-4">Placa</dt>
                        <dd className="col-sm-8">{currentQuote.Vehiculo?.placa}</dd>
                        
                        <dt className="col-sm-4">Estado</dt>
                        <dd className="col-sm-8">{getStatusBadge(currentQuote.estado)}</dd>
                      </dl>
                    </Col>
                  </Row>
                </div>
                
                <div className="mb-4">
                  <h5>Descripción del Problema</h5>
                  <p className="border rounded p-3 bg-light">{currentQuote.descripcion_problema}</p>
                </div>
                
                <h5>Trabajos Cotizados</h5>
                {currentQuote.TrabajosCotizacions?.length > 0 ? (
                  <Table bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Tipo de Trabajo</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentQuote.TrabajosCotizacions.map((work, index) => (
                        <tr key={index}>
                          <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                          <td>{work.descripcion_trabajo}</td>
                          <td className="text-end">Q{parseFloat(work.precio).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="table-light font-weight-bold">
                        <td colSpan="2" className="text-end fw-bold">Total:</td>
                        <td className="text-end fw-bold">
                          Q{calculateQuoteTotal(currentQuote).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">
                    No hay trabajos cotizados para esta solicitud.
                    {currentQuote.estado === 'PENDIENTE' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="ms-3"
                        onClick={() => setActiveTab('addWork')}
                      >
                        Agregar Trabajo
                      </Button>
                    )}
                  </Alert>
                )}
                
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Cerrar
                  </Button>
                  {currentQuote.estado === 'PENDIENTE' && currentQuote.TrabajosCotizacions?.length > 0 && (
                    <Button 
                      variant="success" 
                      onClick={() => {
                        setShowModal(false);
                        handleSendQuote(currentQuote.id_registro_cotizacion);
                      }}
                    >
                      <i className="bi bi-send me-1"></i>
                      Enviar Cotización
                    </Button>
                  )}
                  {currentQuote.estado === 'PENDIENTE' && (
                    <Button variant="primary" onClick={() => setActiveTab('addWork')}>
                      <i className="bi bi-plus-lg me-1"></i>
                      Agregar Trabajo
                    </Button>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="addWork" title="Agregar Trabajo">
                <Form onSubmit={handleSubmitAddWork}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Trabajo</Form.Label>
                    <Form.Select
                      name="id_tipo_trabajo"
                      value={formData.id_tipo_trabajo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un tipo de trabajo</option>
                      {maintenanceTypes.map(type => (
                        <option key={type.id_tipo_trabajo} value={type.id_tipo_trabajo}>
                          {type.nombre_tipo} - Q{type.precio_base}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción del Trabajo</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="descripcion_trabajo"
                      value={formData.descripcion_trabajo}
                      onChange={handleChange}
                      rows={3}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Precio (Q)</Form.Label>
                    <Form.Control
                      type="number"
                      name="precio"
                      value={formData.precio}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setActiveTab('quoteDetails')} disabled={modalLoading}>
                      Volver a Detalles
                    </Button>
                    <Button variant="primary" type="submit" disabled={modalLoading}>
                      {modalLoading ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-1"></i>
                          Guardar Trabajo
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
