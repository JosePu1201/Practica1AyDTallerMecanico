import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function VehiclesList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getMyVehicles(user.id_usuario);
        setVehicles(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los vehículos: ' + err.message);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user]);

  // Handle vehicle detail modal
  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchTermLower = searchTerm.toLowerCase();
    return vehicle.marca.toLowerCase().includes(searchTermLower) ||
      vehicle.modelo.toLowerCase().includes(searchTermLower) ||
      vehicle.placa.toLowerCase().includes(searchTermLower) ||
      vehicle.color.toLowerCase().includes(searchTermLower);
  });

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVO':
        return <Badge bg="success">Activo</Badge>;
      case 'INACTIVO':
        return <Badge bg="warning">Inactivo</Badge>;
      case 'MANTENIMIENTO':
        return <Badge bg="info">Mantenimiento</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando vehículos...</p>
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
        <h1>Mis Vehículos</h1>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar vehículos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-car-front display-4 text-muted"></i>
              <p className="mt-3">No se encontraron vehículos</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Año</th>
                    <th>Placa</th>
                    <th>Color</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id_vehiculo}>
                      <td>{vehicle.marca}</td>
                      <td>{vehicle.modelo}</td>
                      <td>{vehicle.anio}</td>
                      <td>{vehicle.placa}</td>
                      <td>{vehicle.color}</td>
                      <td>{getStatusBadge(vehicle.estado)}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewDetails(vehicle)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          as={Link}
                          to={`/client/vehicles/history/${vehicle.id_vehiculo}`}
                        >
                          <i className="bi bi-clock-history"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Vehicle Detail Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Detalles del Vehículo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVehicle && (
            <div>
              <div className="vehicle-header d-flex mb-4">
                <div className="vehicle-icon me-3">
                  <i className="bi bi-car-front fs-1 text-primary"></i>
                </div>
                <div>
                  <h3 className="mb-1">{selectedVehicle.marca} {selectedVehicle.modelo}</h3>
                  <p className="mb-0 text-muted">
                    Año: {selectedVehicle.anio} | Placa: {selectedVehicle.placa}
                  </p>
                </div>
              </div>

              <div className="vehicle-details mb-4">
                <h5 className="border-bottom pb-2 mb-3">Información General</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <p><strong>Color:</strong> {selectedVehicle.color}</p>
                    <p><strong>Número de Serie:</strong> {selectedVehicle.numero_serie || 'No disponible'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p><strong>Kilometraje:</strong> {selectedVehicle.kilometraje?.toLocaleString() || '0'} km</p>
                    <p><strong>Estado:</strong> {getStatusBadge(selectedVehicle.estado)}</p>
                  </div>
                </div>
              </div>

              <div className="vehicle-registration mb-4">
                <h5 className="border-bottom pb-2 mb-3">Registro</h5>
                <p><strong>Fecha de Registro:</strong> {new Date(selectedVehicle.fecha_registro).toLocaleDateString('es-GT')}</p>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="primary"
                  as={Link}
                  to={`/client/vehicles/history/${selectedVehicle.id_vehiculo}`}
                >
                  Ver Historial
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
