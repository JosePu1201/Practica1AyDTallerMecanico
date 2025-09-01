import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { invoiceService } from '../../../services/invoiceService';

export default function InvoiceDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    partial: 0,
    overdue: 0
  });
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

    fetchInvoiceStats();
  }, []);

  const fetchInvoiceStats = async () => {
    try {
      setLoading(true);
      const invoices = await invoiceService.getInvoices();
      
      const statsData = {
        total: invoices.length,
        pending: invoices.filter(i => i.estado_pago === 'PENDIENTE').length,
        paid: invoices.filter(i => i.estado_pago === 'PAGADO').length,
        partial: invoices.filter(i => i.estado_pago === 'PARCIAL').length,
        overdue: invoices.filter(i => i.estado === 'VENCIDO').length
      };
      
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching invoice stats:', err);
      setError('Error al cargar las estadísticas de facturas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando estadísticas de facturación...</p>
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
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Facturación</h1>
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            as={Link} 
            to="/admin/invoices/create"
          >
            <i className="bi bi-plus-circle me-1"></i>
            Nueva Factura
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="bg-light h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title">Total Facturas</h5>
                  <h2 className="mb-0">{stats.total}</h2>
                </div>
                <div className="bg-primary p-3 rounded-circle">
                  <i className="bi bi-file-earmark-text text-white fs-3"></i>
                </div>
              </div>
              <div className="mt-auto text-end">
                <Link to="/admin/invoices/list" className="btn btn-sm btn-outline-primary">
                  Ver todas
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="bg-light h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title">Pagadas</h5>
                  <h2 className="mb-0 text-success">{stats.paid}</h2>
                </div>
                <div className="bg-success p-3 rounded-circle">
                  <i className="bi bi-check-circle text-white fs-3"></i>
                </div>
              </div>
              <div className="mt-auto text-end">
                <Link to="/admin/invoices/list?status=PAGADO" className="btn btn-sm btn-outline-success">
                  Ver pagadas
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="bg-light h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title">Pendientes</h5>
                  <h2 className="mb-0 text-warning">{stats.pending}</h2>
                </div>
                <div className="bg-warning p-3 rounded-circle">
                  <i className="bi bi-hourglass-split text-white fs-3"></i>
                </div>
              </div>
              <div className="mt-auto text-end">
                <Link to="/admin/invoices/list?status=PENDIENTE" className="btn btn-sm btn-outline-warning">
                  Ver pendientes
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="bg-light h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title">Pagos Parciales</h5>
                  <h2 className="mb-0 text-info">{stats.partial}</h2>
                </div>
                <div className="bg-info p-3 rounded-circle">
                  <i className="bi bi-pie-chart text-white fs-3"></i>
                </div>
              </div>
              <div className="mt-auto text-end">
                <Link to="/admin/invoices/list?status=PARCIAL" className="btn btn-sm btn-outline-info">
                  Ver pagos parciales
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="bg-light h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title">Vencidas</h5>
                  <h2 className="mb-0 text-danger">{stats.overdue}</h2>
                </div>
                <div className="bg-danger p-3 rounded-circle">
                  <i className="bi bi-exclamation-triangle text-white fs-3"></i>
                </div>
              </div>
              <div className="mt-auto text-end">
                <Link to="/admin/invoices/list?status=VENCIDO" className="btn btn-sm btn-outline-danger">
                  Ver vencidas
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Acciones Rápidas</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/admin/invoices/create" className="btn btn-outline-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Generar Nueva Factura
                </Link>
                <Link to="/admin/invoices/list" className="btn btn-outline-secondary">
                  <i className="bi bi-list-ul me-2"></i>
                  Ver Todas las Facturas
                </Link>
                <Link to="/admin/services/list" className="btn btn-outline-info">
                  <i className="bi bi-tools me-2"></i>
                  Ver Servicios
                </Link>
                <Link to="/admin/reportes/ingresos-egresos" className="btn btn-outline-success">
                  <i className="bi bi-graph-up-arrow me-2"></i>
                  Reporte Financiero
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
