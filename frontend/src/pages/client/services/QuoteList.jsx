import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function QuoteList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load user from localStorage
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
  }, [navigate]);

  // Fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getQuotes(user.id_usuario);
        setQuotes(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar las cotizaciones: ' + err.message);
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user]);

  // Open quote detail modal
  const handleViewQuoteDetail = (quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetailModal(true);
  };

  // Filter quotes based on search term and status
  const filteredQuotes = quotes.filter(quote => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      quote.descripcion_problema?.toLowerCase().includes(searchTermLower) ||
      quote.Vehiculo?.marca?.toLowerCase().includes(searchTermLower) ||
      quote.Vehiculo?.modelo?.toLowerCase().includes(searchTermLower) ||
      quote.Vehiculo?.placa?.toLowerCase().includes(searchTermLower);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && quote.estado === filterStatus;
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get quote status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'APROBADA':
        return <Badge bg="success">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge bg="danger">Rechazada</Badge>;
      case 'VENCIDA':
        return <Badge bg="secondary">Vencida</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  // Calculate if a quote is expired
  const isQuoteExpired = (quote) => {
    if (!quote.fecha_vencimiento) return false;
    const today = new Date();
    const expiryDate = new Date(quote.fecha_vencimiento);
    return today > expiryDate;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando cotizaciones...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mis Cotizaciones</h1>
        <Button as={Link} to="/client/services/quote" variant="primary">
          <i className="bi bi-plus-circle me-2"></i>
          Solicitar Cotización
        </Button>
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
                  placeholder="Buscar cotizaciones..."
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
                <option value="APROBADA">Aprobadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="VENCIDA">Vencidas</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-text display-4 text-muted"></i>
              <h3 className="mt-3">No se encontraron cotizaciones</h3>
              <p className="mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No hay cotizaciones que coincidan con los criterios de búsqueda.' 
                  : 'Aún no tienes cotizaciones solicitadas.'}
              </p>
              <Button as={Link} to="/client/services/quote" variant="primary">
                <i className="bi bi-plus-circle me-2"></i>
                Solicitar Cotización
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Vehículo</th>
                    <th>Problema</th>
                    <th>Fecha</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map(quote => {
                    const expired = isQuoteExpired(quote) && quote.estado === 'PENDIENTE';
                    return (
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
                        <td>{formatDate(quote.fecha_cotizacion)}</td>
                        <td>
                          {expired ? (
                            <span className="text-danger">
                              {formatDate(quote.fecha_vencimiento)}
                            </span>
                          ) : (
                            formatDate(quote.fecha_vencimiento)
                          )}
                        </td>
                        <td>
                          {expired ? getStatusBadge('VENCIDA') : getStatusBadge(quote.estado)}
                        </td>
                        <td className="text-end fw-bold">
                          {quote.total_cotizacion ? formatCurrency(quote.total_cotizacion) : 'Pendiente'}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleViewQuoteDetail(quote)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Quote Detail Modal */}
      <Modal
        show={showQuoteDetailModal}
        onHide={() => setShowQuoteDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Detalles de la Cotización #{selectedQuote?.id_registro_cotizacion}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuote && (
            <>
              <div className="quote-header d-flex mb-4">
                <div className="vehicle-icon me-3 p-3 bg-light rounded-circle">
                  <i className="bi bi-car-front fs-3 text-primary"></i>
                </div>
                <div>
                  <h3 className="mb-1">{selectedQuote.Vehiculo?.marca} {selectedQuote.Vehiculo?.modelo}</h3>
                  <p className="text-muted mb-0">
                    Placa: <strong>{selectedQuote.Vehiculo?.placa}</strong> | 
                    Año: <strong>{selectedQuote.Vehiculo?.anio}</strong>
                  </p>
                </div>
              </div>

              <div className="quote-info bg-light p-3 rounded mb-4">
                <Row>
                  <Col md={6}>
                    <p><strong>Fecha de Cotización:</strong> {formatDate(selectedQuote.fecha_cotizacion)}</p>
                    <p><strong>Fecha de Vencimiento:</strong> {formatDate(selectedQuote.fecha_vencimiento)}</p>
                    <p><strong>Estado:</strong> {isQuoteExpired(selectedQuote) && selectedQuote.estado === 'PENDIENTE' ? 
                      getStatusBadge('VENCIDA') : getStatusBadge(selectedQuote.estado)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Problema Reportado:</strong></p>
                    <p className="border-start ps-3">{selectedQuote.descripcion_problema}</p>
                  </Col>
                </Row>
              </div>

              <h5 className="border-bottom pb-2 mb-3">Trabajos Cotizados</h5>
              
              {selectedQuote.TrabajosCotizacion?.length > 0 ? (
                <Table bordered responsive className="mb-4">
                  <thead className="table-light">
                    <tr>
                      <th>Tipo de Trabajo</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th className="text-end">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.TrabajosCotizacion.map(trabajo => (
                      <tr key={trabajo.id_trabajo_cotizacion}>
                        <td>{trabajo.TipoMantenimiento?.nombre_tipo}</td>
                        <td>{trabajo.descripcion_trabajo}</td>
                        <td>{getStatusBadge(trabajo.estado)}</td>
                        <td className="text-end">{formatCurrency(trabajo.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">Total:</td>
                      <td className="text-end fw-bold">
                        {formatCurrency(selectedQuote.total_cotizacion || 
                          selectedQuote.TrabajosCotizacion.reduce(
                            (sum, trabajo) => sum + Number(trabajo.precio || 0), 0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              ) : (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Esta cotización aún no tiene trabajos detallados.
                </Alert>
              )}

              {isQuoteExpired(selectedQuote) && selectedQuote.estado === 'PENDIENTE' && (
                <Alert variant="warning">
                  <Alert.Heading>Cotización Vencida</Alert.Heading>
                  <p>Esta cotización ha expirado. Si desea continuar con el servicio, por favor solicite una nueva cotización.</p>
                </Alert>
              )}
              
              {selectedQuote.estado === 'PENDIENTE' && !isQuoteExpired(selectedQuote) && (
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button 
                    variant="success"
                    onClick={() => {
                      // Here you would implement the accept quote functionality
                      alert('Esta función será implementada próximamente');
                    }}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Aceptar Cotización
                  </Button>
                  <Button 
                    variant="outline-danger"
                    onClick={() => {
                      // Here you would implement the reject quote functionality
                      alert('Esta función será implementada próximamente');
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Rechazar Cotización
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
