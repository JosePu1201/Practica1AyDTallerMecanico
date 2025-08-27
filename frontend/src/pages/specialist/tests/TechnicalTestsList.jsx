import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function TechnicalTestsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultFormData, setResultFormData] = useState({
    descripcion_resultado: '',
    resultado_satisfactorio: false
  });
  const [submitting, setSubmitting] = useState(false);

  // Get user from localStorage
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

  // Fetch technical tests when user is loaded
  useEffect(() => {
    const fetchTests = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoading(true);
        const data = await serviceSpecialistService.getTechnicalTestsBySpecialist(user.id_usuario);
        setTests(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar las pruebas técnicas: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchTests();
  }, [user]);

  // Filter tests based on search term
  const filteredTests = tests.filter(test => {
    const searchTermLower = searchTerm.toLowerCase();
    return test.descripcion_prueba_tecnica?.toLowerCase().includes(searchTermLower) ||
      test.AsignacionTrabajo?.descripcion?.toLowerCase().includes(searchTermLower) ||
      test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchTermLower) ||
      test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchTermLower);
  });

  // Open modal with test details
  const handleViewTest = (test) => {
    setSelectedTest(test);
    setShowModal(true);
  };

  // Toggle result form
  const handleShowResultForm = () => {
    setShowResultForm(!showResultForm);
  };

  // Handle result form input changes
  const handleResultFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResultFormData({
      ...resultFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Submit result form
  const handleSubmitResult = async (e) => {
    e.preventDefault();
    
    if (!resultFormData.descripcion_resultado) {
      alert('Por favor ingrese una descripción del resultado');
      return;
    }
    
    try {
      setSubmitting(true);
      await serviceSpecialistService.addTestResult(selectedTest.id_prueba_tecnica, resultFormData);
      
      // Refresh tests to include the new result
      const updatedTests = await serviceSpecialistService.getTechnicalTestsBySpecialist(user.id_usuario);
      setTests(updatedTests);
      
      // Close form and reset
      setShowResultForm(false);
      setResultFormData({
        descripcion_resultado: '',
        resultado_satisfactorio: false
      });
      setSubmitting(false);
      
    } catch (err) {
      alert('Error al guardar el resultado: ' + err.message);
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando pruebas técnicas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Pruebas Técnicas</h1>
        <Button as={Link} to="/specialist/tests/create" variant="primary">
          <i className="bi bi-plus-circle me-2"></i> Nueva Prueba Técnica
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar pruebas técnicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          {filteredTests.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-speedometer2 display-4 text-muted"></i>
              <p className="mt-3">No se encontraron pruebas técnicas</p>
              <Link to="/specialist/tests/create" className="btn btn-primary mt-2">
                Crear Nueva Prueba Técnica
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Resultados</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map(test => (
                    <tr key={test.id_prueba_tecnica}>
                      <td>{test.id_prueba_tecnica}</td>
                      <td>
                        {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                        {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                        <div className="small text-muted">
                          {test.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                        </div>
                      </td>
                      <td>{formatDate(test.fecha_prueba)}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {test.descripcion_prueba_tecnica}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge bg={
                          test.ResultadoPruebaTecnicas?.length > 0 ? 
                            (test.ResultadoPruebaTecnicas[0].resultado_satisfactorio ? 'success' : 'danger') : 
                            'warning'
                        }>
                          {test.ResultadoPruebaTecnicas?.length > 0 ? 
                            (test.ResultadoPruebaTecnicas[0].resultado_satisfactorio ? 'Satisfactorio' : 'No satisfactorio') : 
                            'Pendiente'}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewTest(test)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        {!test.ResultadoPruebaTecnicas?.length && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            as={Link}
                            to={`/specialist/tests/result/${test.id_prueba_tecnica}`}
                          >
                            <i className="bi bi-plus-circle"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Test Detail Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setShowResultForm(false);
          setSelectedTest(null);
        }}
        size="lg"
        aria-labelledby="test-detail-modal"
      >
        {selectedTest && (
          <>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title id="test-detail-modal">
                Prueba Técnica #{selectedTest.id_prueba_tecnica}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-4">
                <h5 className="border-bottom pb-2">Información de la Prueba</h5>
                <Row className="mb-3">
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Fecha:</dt>
                      <dd className="col-sm-8">{formatDate(selectedTest.fecha_prueba)}</dd>
                      
                      <dt className="col-sm-4">Vehículo:</dt>
                      <dd className="col-sm-8">
                        {selectedTest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                        {selectedTest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </dd>
                      
                      <dt className="col-sm-4">Placa:</dt>
                      <dd className="col-sm-8">
                        {selectedTest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                      </dd>
                    </dl>
                  </Col>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Trabajo:</dt>
                      <dd className="col-sm-8">{selectedTest.AsignacionTrabajo?.TipoMantenimiento?.nombre_tipo}</dd>
                      
                      <dt className="col-sm-4">Estado:</dt>
                      <dd className="col-sm-8">
                        <Badge bg={
                          selectedTest.AsignacionTrabajo?.estado === 'COMPLETADO' ? 'success' :
                          selectedTest.AsignacionTrabajo?.estado === 'EN_PROCESO' ? 'primary' : 'warning'
                        }>
                          {selectedTest.AsignacionTrabajo?.estado || 'PENDIENTE'}
                        </Badge>
                      </dd>
                    </dl>
                  </Col>
                </Row>
                
                <h6>Descripción de la Prueba</h6>
                <p className="bg-light p-3 rounded">{selectedTest.descripcion_prueba_tecnica}</p>
              </div>
              
              {selectedTest.ResultadoPruebaTecnicas?.length > 0 ? (
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Resultados</h5>
                  {selectedTest.ResultadoPruebaTecnicas.map((result, idx) => (
                    <div key={result.id_resultado_prueba || idx} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Resultado #{result.id_resultado_prueba}</h6>
                        <Badge bg={result.resultado_satisfactorio ? 'success' : 'danger'}>
                          {result.resultado_satisfactorio ? 'Satisfactorio' : 'No satisfactorio'}
                        </Badge>
                      </div>
                      <p className="bg-light p-3 rounded mb-3">{result.descripcion_resultado}</p>
                      
                      {/* Solutions section */}
                      {result.SolucionPropuesta?.length > 0 ? (
                        <div>
                          <h6>Soluciones Propuestas</h6>
                          {result.SolucionPropuesta.map((solution, idx) => (
                            <Card key={solution.id_solucion || idx} className="mb-2 border-left-primary">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">Solución #{solution.id_solucion}</h6>
                                  <Badge bg={
                                    solution.prioridad === 'alta' ? 'danger' :
                                    solution.prioridad === 'media' ? 'warning' : 'info'
                                  }>
                                    Prioridad: {solution.prioridad}
                                  </Badge>
                                </div>
                                <p>{solution.descripcion_solucion}</p>
                                <div className="d-flex justify-content-between small text-muted">
                                  <span>Costo estimado: Q{solution.costo_estimado}</span>
                                  <span>Tiempo estimado: {solution.tiempo_estimado} horas</span>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 border rounded">
                          <p className="mb-2 text-muted">No hay soluciones propuestas para este resultado</p>
                          <Link 
                            to={`/specialist/tests/solution/${result.id_resultado_prueba}`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Agregar Solución
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {showResultForm ? (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Agregar Resultado</h5>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={handleShowResultForm}
                        >
                          <i className="bi bi-x-lg"></i> Cancelar
                        </Button>
                      </div>
                      
                      <Form onSubmit={handleSubmitResult}>
                        <Form.Group className="mb-3">
                          <Form.Label>Descripción del Resultado</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="descripcion_resultado"
                            value={resultFormData.descripcion_resultado}
                            onChange={handleResultFormChange}
                            placeholder="Describa los resultados de la prueba técnica"
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            label="Resultado satisfactorio"
                            name="resultado_satisfactorio"
                            checked={resultFormData.resultado_satisfactorio}
                            onChange={handleResultFormChange}
                          />
                          <Form.Text className="text-muted">
                            Marque esta casilla si la prueba ha tenido un resultado satisfactorio
                          </Form.Text>
                        </Form.Group>
                        
                        <div className="d-flex justify-content-end">
                          <Button 
                            variant="primary" 
                            type="submit"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Guardando...
                              </>
                            ) : (
                              'Guardar Resultado'
                            )}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded mb-4">
                      <i className="bi bi-clipboard-data display-4 text-muted"></i>
                      <p className="mt-3 mb-3">No hay resultados registrados para esta prueba técnica</p>
                      <Button 
                        variant="primary"
                        onClick={handleShowResultForm}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Agregar Resultado
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowModal(false);
                setShowResultForm(false);
                setSelectedTest(null);
              }}>
                Cerrar
              </Button>
              {selectedTest.ResultadoPruebaTecnicas?.length > 0 && !selectedTest.ResultadoPruebaTecnicas[0]?.SolucionPropuestas?.length && (
                <Link 
                  to={`/specialist/tests/solution/${selectedTest.ResultadoPruebaTecnicas[0].id_resultado_prueba}`}
                  className="btn btn-primary"
                >
                  <i className="bi bi-lightbulb me-2"></i>
                  Agregar Solución
                </Link>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}
