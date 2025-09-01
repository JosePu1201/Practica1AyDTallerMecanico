import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceService } from '../../../services/invoiceService';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  
  const [completedServices, setCompletedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    id_registro: '',
    impuestos: 0.12,  // Default 12% tax
    descuento: 0,
    observaciones: '',
    metodo_pago: 'EFECTIVO'  // Default payment method
  });
  
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
    
    fetchCompletedServices();
  }, [navigate]);

  const fetchCompletedServices = async () => {
    try {
      setLoading(true);
      const services = await invoiceService.getCompletedServices();
      
      // Filter services that don't already have invoices
      const allInvoices = await invoiceService.getInvoices();
      const invoicedRegistros = allInvoices.map(inv => inv.id_registro);
      
      const notInvoicedServices = services.filter(service => !invoicedRegistros.includes(service.id_registro));
      
      setCompletedServices(notInvoicedServices);
    } catch (err) {
      console.error('Error fetching completed services:', err);
      setError('Error al cargar los servicios completados');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId) => {
    const service = completedServices.find(s => s.id_registro.toString() === serviceId);
    setSelectedService(service);
    setFormData({
      ...formData,
      id_registro: serviceId
    });
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
    
    if (!formData.id_registro) {
      setError('Por favor, seleccione un servicio para facturar');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      const dataToSend = {
        ...formData,
        impuestos: parseFloat(formData.impuestos),
        descuento: parseFloat(formData.descuento)
      };
      
      const result = await invoiceService.generateInvoice(dataToSend);
      setSuccess('Factura generada correctamente');
      
      // Reset form
      setFormData({
        id_registro: '',
        impuestos: 0.12,
        descuento: 0,
        observaciones: '',
        metodo_pago: 'EFECTIVO'
      });
      setSelectedService(null);
      
      // Refresh available services
      fetchCompletedServices();
      
      // Navigate to invoice detail after a short delay
      setTimeout(() => {
        navigate(`/admin/invoices/detail/${result.facturaNueva.id_factura}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError('Error al generar la factura: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-GT');
  };
  
  const getTotalWorkPrice = (service) => {
    if (!service || !service.AsignacionTrabajos) return 0;
    return service.AsignacionTrabajos.reduce((sum, work) => sum + parseFloat(work.precio || 0), 0);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando servicios completados...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Generar Factura</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/invoices/list" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Volver a la lista
          </Link>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      {completedServices.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <i className="bi bi-tools display-4 text-muted mb-3"></i>
            <h3>No hay servicios completados pendientes de facturación</h3>
            <p className="text-muted mb-4">
              Todos los servicios completados ya han sido facturados o no hay servicios en estado completado.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button as={Link} to="/admin/services/list" variant="primary">
                Ver todos los servicios
              </Button>
              <Button as={Link} to="/admin/invoices/list" variant="outline-primary">
                Ver facturas existentes
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={7}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Seleccionar Servicio</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="table-light">
                        <tr>
                          <th></th>
                          <th>ID</th>
                          <th>Vehículo</th>
                          <th>Fecha Finalización</th>
                          <th>Trabajos</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedServices.map((service) => {
                          const totalPrice = getTotalWorkPrice(service);
                          return (
                            <tr 
                              key={service.id_registro} 
                              onClick={() => handleServiceSelect(service.id_registro.toString())}
                              className={formData.id_registro === service.id_registro.toString() ? 'table-primary' : ''}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <Form.Check
                                  type="radio"
                                  name="id_registro"
                                  value={service.id_registro}
                                  checked={formData.id_registro === service.id_registro.toString()}
                                  onChange={() => handleServiceSelect(service.id_registro.toString())}
                                />
                              </td>
                              <td>#{service.id_registro}</td>
                              <td>
                                {service.Vehiculo?.marca} {service.Vehiculo?.modelo}
                                <div className="small text-muted">{service.Vehiculo?.placa}</div>
                              </td>
                              <td>{formatDate(service.fecha_finalizacion_real)}</td>
                              <td>{service.AsignacionTrabajos?.length || 0} trabajos</td>
                              <td className="fw-bold">Q{totalPrice.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
              
              {selectedService && (
                <Card className="shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Detalles del Servicio</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Vehículo:</strong> {selectedService.Vehiculo?.marca} {selectedService.Vehiculo?.modelo}
                        </p>
                        <p className="mb-1">
                          <strong>Placa:</strong> {selectedService.Vehiculo?.placa}
                        </p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Fecha Ingreso:</strong> {formatDate(selectedService.fecha_ingreso)}
                        </p>
                        <p className="mb-1">
                          <strong>Fecha Finalización:</strong> {formatDate(selectedService.fecha_finalizacion_real)}
                        </p>
                      </Col>
                    </Row>
                    
                    <h6>Descripción del Problema</h6>
                    <p className="bg-light p-2 rounded">{selectedService.descripcion_problema}</p>
                    
                    <h6 className="mt-3">Trabajos Realizados</h6>
                    <div className="table-responsive">
                      <Table size="sm" bordered>
                        <thead className="table-light">
                          <tr>
                            <th>Descripción</th>
                            <th className="text-end">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedService.AsignacionTrabajos?.map((work) => (
                            <tr key={work.id_asignacion}>
                              <td>{work.descripcion}</td>
                              <td className="text-end">Q{parseFloat(work.precio).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td className="text-end fw-bold">Total:</td>
                            <td className="text-end fw-bold">
                              Q{getTotalWorkPrice(selectedService).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
            
            <Col md={5}>
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Detalles de la Factura</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Impuestos (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      name="impuestos"
                      value={formData.impuestos}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">
                      Ejemplo: 0.12 para un impuesto del 12%
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Descuento (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      name="descuento"
                      value={formData.descuento}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">
                      Ejemplo: 0.05 para un descuento del 5%
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Método de Pago Preferido</Form.Label>
                    <Form.Select
                      name="metodo_pago"
                      value={formData.metodo_pago}
                      onChange={handleInputChange}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta de Crédito/Débito</option>
                      <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                      <option value="CHEQUE">Cheque</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Observaciones</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      placeholder="Ingrese cualquier observación relevante para esta factura"
                    />
                  </Form.Group>
                  
                  {selectedService && (
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6>Resumen</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <strong>Q{getTotalWorkPrice(selectedService).toFixed(2)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Impuestos ({formData.impuestos * 100}%):</span>
                        <strong>Q{(getTotalWorkPrice(selectedService) * formData.impuestos).toFixed(2)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Descuento ({formData.descuento * 100}%):</span>
                        <strong>Q{(getTotalWorkPrice(selectedService) * formData.descuento).toFixed(2)}</strong>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <h5>Total:</h5>
                        <h5 className="text-primary">
                          Q{(getTotalWorkPrice(selectedService) - 
                            (getTotalWorkPrice(selectedService) * formData.descuento) + 
                            (getTotalWorkPrice(selectedService) * formData.impuestos)).toFixed(2)}
                        </h5>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-grid gap-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={!formData.id_registro || creating}
                    >
                      {creating ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Generando Factura...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-receipt me-2"></i>
                          Generar Factura
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      as={Link}
                      to="/admin/invoices/list"
                    >
                      Cancelar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </div>
  );
}
