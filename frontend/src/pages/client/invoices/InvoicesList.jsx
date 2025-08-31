import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function InvoicesList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    id_factura: '',
    monto_pago: 0,
    metodo_pago: 'EFECTIVO',
    referencia_pago: '',
    id_usuario_registro: '',
    observaciones: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const userData = JSON.parse(s);
        setUser(userData);
        setPaymentFormData(prev => ({
          ...prev,
          id_usuario_registro: userData.id_usuario
        }));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getInvoices(user.id_usuario);
        setInvoices(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar las facturas: ' + err.message);
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      invoice.numero_factura?.toLowerCase().includes(searchTermLower) ||
      invoice.observaciones?.toLowerCase().includes(searchTermLower) ||
      invoice.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchTermLower) ||
      invoice.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchTermLower) ||
      invoice.RegistroServicioVehiculo?.Vehiculo?.placa?.toLowerCase().includes(searchTermLower);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && invoice.estado_pago === filterStatus;
  });

  // Get payment status badge
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'PAGADO':
        return <Badge bg="success">Pagado</Badge>;
      case 'VENCIDO':
        return <Badge bg="danger">Vencido</Badge>;
      case 'PARCIAL':
        return <Badge bg="info">Parcial</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Open payment modal
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentFormData(prev => ({
      ...prev,
      id_factura: invoice.id_factura,
      monto_pago: invoice.total
    }));
    setShowPaymentModal(true);
  };

  // Handle payment form input change
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit payment form
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    try {
      setSubmittingPayment(true);
      await clientService.payInvoice(paymentFormData);
      setPaymentSuccess(true);
      
      // Refresh invoices
      const updatedInvoices = await clientService.getInvoices(user.id_usuario);
      setInvoices(updatedInvoices);
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Error al procesar el pago: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mis Facturas</h1>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar facturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="PAGADO">Pagadas</option>
                <option value="VENCIDO">Vencidas</option>
                <option value="PARCIAL">Pagos Parciales</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt display-4 text-muted"></i>
              <p className="mt-3">No se encontraron facturas</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Nº Factura</th>
                    <th>Fecha</th>
                    <th>Vehículo</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id_factura}>
                      <td>{invoice.numero_factura}</td>
                      <td>
                        <div>{formatDate(invoice.fecha_emision)}</div>
                        <small className="text-muted">Vence: {formatDate(invoice.fecha_vencimiento)}</small>
                      </td>
                      <td>
                        <div>{invoice.RegistroServicioVehiculo?.Vehiculo?.marca} {invoice.RegistroServicioVehiculo?.Vehiculo?.modelo}</div>
                        <small className="text-muted">{invoice.RegistroServicioVehiculo?.Vehiculo?.placa}</small>
                      </td>
                      <td>{getPaymentStatusBadge(invoice.estado_pago)}</td>
                      <td className="text-end fw-bold">{formatCurrency(invoice.total)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="Ver detalles"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          
                          {invoice.estado_pago === 'PENDIENTE' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleOpenPaymentModal(invoice)}
                              title="Pagar factura"
                            >
                              <i className="bi bi-credit-card"></i>
                            </Button>
                          )}
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

      {/* Payment Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Pagar Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentSuccess && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Pago procesado exitosamente
            </Alert>
          )}
          
          {selectedInvoice && (
            <>
              <div className="invoice-summary bg-light p-3 rounded mb-4">
                <h5 className="border-bottom pb-2 mb-3">Resumen de la Factura</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Nº Factura:</strong> {selectedInvoice.numero_factura}</p>
                    <p><strong>Fecha de Emisión:</strong> {formatDate(selectedInvoice.fecha_emision)}</p>
                    <p><strong>Fecha de Vencimiento:</strong> {formatDate(selectedInvoice.fecha_vencimiento)}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Vehículo:</strong> {selectedInvoice.RegistroServicioVehiculo?.Vehiculo?.marca} {selectedInvoice.RegistroServicioVehiculo?.Vehiculo?.modelo}</p>
                    <p><strong>Placa:</strong> {selectedInvoice.RegistroServicioVehiculo?.Vehiculo?.placa}</p>
                    <p><strong>Total a Pagar:</strong> <span className="fw-bold">{formatCurrency(selectedInvoice.total)}</span></p>
                  </Col>
                </Row>
              </div>
              
              <Form onSubmit={handleSubmitPayment}>
                <Form.Group className="mb-3">
                  <Form.Label>Método de Pago</Form.Label>
                  <Form.Select
                    name="metodo_pago"
                    value={paymentFormData.metodo_pago}
                    onChange={handlePaymentChange}
                    required
                    disabled={submittingPayment}
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                    <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Referencia de Pago</Form.Label>
                  <Form.Control
                    type="text"
                    name="referencia_pago"
                    value={paymentFormData.referencia_pago}
                    onChange={handlePaymentChange}
                    placeholder="Ej: Número de transacción, últimos 4 dígitos de tarjeta, etc."
                    disabled={submittingPayment}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Monto a Pagar</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>Q</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="monto_pago"
                      value={paymentFormData.monto_pago}
                      onChange={handlePaymentChange}
                      required
                      disabled={submittingPayment}
                    />
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones"
                    value={paymentFormData.observaciones}
                    onChange={handlePaymentChange}
                    placeholder="Observaciones adicionales sobre el pago"
                    disabled={submittingPayment}
                  />
                </Form.Group>
                
                <div className="d-flex justify-content-end mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setShowPaymentModal(false)}
                    className="me-2"
                    disabled={submittingPayment}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-credit-card me-2"></i>
                        Confirmar Pago
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
