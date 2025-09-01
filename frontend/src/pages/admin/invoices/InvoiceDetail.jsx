import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceService } from '../../../services/invoiceService';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
    
    fetchInvoiceDetails();
  }, [id, navigate]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch all invoices since we don't have a specific endpoint to get one by ID
      const allInvoices = await invoiceService.getInvoices();
      const invoiceData = allInvoices.find(inv => inv.id_factura.toString() === id);
      
      if (!invoiceData) {
        setError('Factura no encontrada');
        setLoading(false);
        return;
      }
      
      setInvoice(invoiceData);
      
      // Fetch payment history
      const paymentsData = await invoiceService.getInvoicePayments(id);
      setPayments(paymentsData);
      
      // Fetch balance
      const balanceData = await invoiceService.getInvoiceBalance(id);
      setBalance(balanceData);
      
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Error al cargar los detalles de la factura');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (invoice) => {
    if (invoice.estado === 'VENCIDO') {
      return <Badge bg="danger">Vencida</Badge>;
    }
    
    switch (invoice.estado_pago) {
      case 'PAGADO':
        return <Badge bg="success">Pagada</Badge>;
      case 'PENDIENTE':
        return <Badge bg="warning" text="dark">Pendiente</Badge>;
      case 'PARCIAL':
        return <Badge bg="info">Pago Parcial</Badge>;
      default:
        return <Badge bg="secondary">{invoice.estado_pago}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando detalles de factura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/admin/invoices/list')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  if (!invoice) {
    return (
      <Alert variant="warning" className="my-4">
        <Alert.Heading>Factura no encontrada</Alert.Heading>
        <p>La factura solicitada no existe o ha sido eliminada.</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-warning" onClick={() => navigate('/admin/invoices/list')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Factura {invoice.numero_factura}</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/invoices/list" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Volver a la lista
          </Link>
          <Button variant="outline-primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>
            Imprimir
          </Button>
        </div>
      </div>

      <div className="invoice-container">
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Detalles de la Factura</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <div className="mb-4">
                  <h6 className="text-muted mb-2">Información de la Factura</h6>
                  <Row>
                    <Col sm={6}>
                      <p className="mb-1">
                        <strong>Número de Factura:</strong> {invoice.numero_factura}
                      </p>
                      <p className="mb-1">
                        <strong>ID:</strong> {invoice.id_factura}
                      </p>
                      <p className="mb-1">
                        <strong>ID Registro Servicio:</strong> {invoice.id_registro}
                      </p>
                    </Col>
                    <Col sm={6}>
                      <p className="mb-1">
                        <strong>Fecha de Emisión:</strong> {formatDate(invoice.fecha_emision)}
                      </p>
                      <p className="mb-1">
                        <strong>Fecha de Vencimiento:</strong> {formatDate(invoice.fecha_vencimiento)}
                      </p>
                      <p className="mb-1">
                        <strong>Estado:</strong> {getStatusBadge(invoice)}
                      </p>
                    </Col>
                  </Row>
                </div>
                
                {invoice.observaciones && (
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Observaciones</h6>
                    <p className="bg-light p-3 rounded">{invoice.observaciones}</p>
                  </div>
                )}
              </Col>
              <Col md={4} className="text-end border-start ps-4">
                <h6 className="text-muted mb-3">Resumen de Pago</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(invoice.subtotal)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Impuestos:</span>
                  <strong>{formatCurrency(invoice.impuestos)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Descuentos:</span>
                  <strong>{formatCurrency(invoice.descuentos)}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Total:</h5>
                  <h4 className="text-primary">{formatCurrency(invoice.total)}</h4>
                </div>
                {balance && balance.saldo > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <h6>Saldo Pendiente:</h6>
                    <h5 className="text-danger">{formatCurrency(balance.saldo)}</h5>
                  </div>
                )}
                <div className="mt-3">
                  <p className="mb-1">
                    <strong>Método de Pago:</strong> {invoice.metodo_pago_preferido || 'No especificado'}
                  </p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Historial de Pagos</h5>
          </Card.Header>
          <Card.Body>
            {payments.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-cash-coin text-muted display-4"></i>
                <p className="mt-3 mb-0">No hay pagos registrados para esta factura.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th>ID Pago</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método de Pago</th>
                      <th>Referencia</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id_pago}>
                        <td>{payment.id_pago}</td>
                        <td>{formatDate(payment.fecha_pago)}</td>
                        <td className="fw-bold">{formatCurrency(payment.monto_pago)}</td>
                        <td>{payment.metodo_pago}</td>
                        <td>{payment.referencia_pago || '-'}</td>
                        <td>{payment.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="2" className="fw-bold text-end">Total Pagado:</td>
                      <td className="fw-bold">
                        {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.monto_pago), 0))}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Acciones</h5>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-3">
              <Button variant="outline-primary" onClick={() => window.print()}>
                <i className="bi bi-printer me-2"></i>
                Imprimir Factura
              </Button>
              <Button variant="outline-info" disabled>
                <i className="bi bi-envelope me-2"></i>
                Enviar por Email
              </Button>
              <Button variant="outline-success" as={Link} to={`/admin/services/detail/${invoice.id_registro}`}>
                <i className="bi bi-tools me-2"></i>
                Ver Servicio
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
