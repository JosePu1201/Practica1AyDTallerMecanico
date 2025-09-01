import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Badge, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { invoiceService } from '../../../services/invoiceService';

export default function InvoiceList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') || 'TODOS';
  
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
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
    
    fetchInvoices();
  }, [navigate]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, filterStatus, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (filterStatus !== 'TODOS') {
      filtered = filtered.filter(invoice => 
        invoice.estado_pago === filterStatus || invoice.estado === filterStatus
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        (invoice.numero_factura && invoice.numero_factura.toLowerCase().includes(search)) ||
        (String(invoice.id_factura).includes(search)) ||
        (invoice.observaciones && invoice.observaciones.toLowerCase().includes(search))
      );
    }
    
    setFilteredInvoices(filtered);
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Facturas</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/invoices" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Volver al Dashboard
          </Link>
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

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={7}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por número de factura o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                    title="Limpiar búsqueda"
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={5}>
              <div className="d-flex justify-content-md-end gap-2">
                <Button 
                  variant={filterStatus === 'TODOS' ? 'primary' : 'outline-primary'} 
                  onClick={() => setFilterStatus('TODOS')}
                >
                  Todas
                </Button>
                <Button 
                  variant={filterStatus === 'PENDIENTE' ? 'warning' : 'outline-warning'} 
                  onClick={() => setFilterStatus('PENDIENTE')}
                >
                  Pendientes
                </Button>
                <Button 
                  variant={filterStatus === 'PAGADO' ? 'success' : 'outline-success'} 
                  onClick={() => setFilterStatus('PAGADO')}
                >
                  Pagadas
                </Button>
                <Button 
                  variant={filterStatus === 'VENCIDO' ? 'danger' : 'outline-danger'} 
                  onClick={() => setFilterStatus('VENCIDO')}
                >
                  Vencidas
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Método Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <i className="bi bi-file-earmark-excel display-4 text-muted"></i>
                    <p className="mt-3 mb-0">
                      {searchTerm 
                        ? 'No se encontraron facturas que coincidan con la búsqueda.' 
                        : filterStatus !== 'TODOS'
                          ? `No hay facturas con estado ${filterStatus}.`
                          : 'No hay facturas registradas en el sistema.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id_factura}>
                    <td>{invoice.id_factura}</td>
                    <td>{invoice.numero_factura}</td>
                    <td>{formatDate(invoice.fecha_emision)}</td>
                    <td>
                      {formatDate(invoice.fecha_vencimiento)}
                    </td>
                    <td className="fw-bold">{formatCurrency(invoice.total)}</td>
                    <td>{getStatusBadge(invoice)}</td>
                    <td>{invoice.metodo_pago_preferido || '-'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Link 
                          to={`/admin/invoices/detail/${invoice.id_factura}`}
                          className="btn btn-sm btn-outline-primary"
                          title="Ver detalles"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Button 
                          variant="outline-success"
                          size="sm"
                          title="Imprimir factura"
                          onClick={() => window.print()} // This would be replaced with actual print functionality
                        >
                          <i className="bi bi-printer"></i>
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
    </div>
  );
}
