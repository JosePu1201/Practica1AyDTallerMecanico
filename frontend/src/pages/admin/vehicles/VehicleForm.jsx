import React, { useEffect, useMemo, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function VehicleForm() {
  const { id } = useParams();           // si existe => edición
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleFromState = location.state?.vehicle || null;

  // Prefill inmediato si vienes desde la lista; si entras directo, quedarán vacíos hasta el fetch
  const [formData, setFormData] = useState({
    placa:        vehicleFromState?.placa || '',
    marca:        vehicleFromState?.marca || '',
    modelo:       vehicleFromState?.modelo || '',
    anio:         vehicleFromState?.anio ?? '',
    numero_serie: vehicleFromState?.numero_serie || '',
    color:        vehicleFromState?.color || '',
    kilometraje:  vehicleFromState?.kilometraje ?? 0,
    id_cliente:   vehicleFromState?.id_cliente ?? '',
  });

  const [errors, setErrors] = useState({});
  // Si hay id y NO hay vehículo en state, mostramos loading hasta traerlo
  const [loading, setLoading] = useState(!!id && !vehicleFromState);
  const [submitting, setSubmitting] = useState(false);

  // Clientes
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    // Editar: si no trajiste el vehículo por state, lo cargamos del backend
    if (id && !vehicleFromState) {
      loadVehicle();
    }
  }, [id, vehicleFromState]);

  useEffect(() => {
    // Siempre cargamos TODOS los clientes
    loadClients();
  }, []);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/vehiculos/${id}`);
      const v = res.data?.vehiculo || res.data;
      setFormData(prev => ({
        ...prev,
        placa:        v?.placa || '',
        marca:        v?.marca || '',
        modelo:       v?.modelo || '',
        anio:         v?.anio ?? '',
        numero_serie: v?.numero_serie || '',
        color:        v?.color || '',
        kilometraje:  v?.kilometraje ?? 0,
        id_cliente:   v?.id_cliente ?? '',
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const res = await axios.get('/api/personas/listar-usuarios-clientes');
      setClients(res.data?.usuarios || []);
    } catch (err) {
      setClients([]);
      toast.error(err.response?.data?.error || 'No se pudieron cargar los clientes');
    } finally {
      setLoadingClients(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'placa')        val = value.toUpperCase();
    if (name === 'kilometraje')  val = value === '' ? '' : Math.max(0, Number(value));
    if (name === 'anio')         val = value === '' ? '' : Number(value);
    if (name === 'id_cliente')   val = value === '' ? '' : Number(value);

    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!formData.marca?.trim())  e.marca  = 'La marca es obligatoria';
    if (!formData.modelo?.trim()) e.modelo = 'El modelo es obligatorio';

    if (!formData.placa?.trim())  e.placa  = 'La placa es obligatoria';
    else if (!/^[A-Z0-9-]{3,20}$/.test(formData.placa))
      e.placa = 'Placa inválida (usa letras/números/guiones, 3-20)';

    if (formData.anio !== '' && (formData.anio < 1900 || formData.anio > currentYear + 1))
      e.anio = `Año inválido (1900 - ${currentYear + 1})`;

    if (formData.kilometraje !== '' && Number.isNaN(Number(formData.kilometraje)))
      e.kilometraje = 'Kilometraje inválido';

    if (!formData.id_cliente) e.id_cliente = 'Debe seleccionar un cliente';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        placa:        formData.placa,
        marca:        formData.marca,
        modelo:       formData.modelo,
        anio:         formData.anio === '' ? null : Number(formData.anio),
        numero_serie: formData.numero_serie?.trim() || null,
        color:        formData.color?.trim() || null,
        kilometraje:  formData.kilometraje === '' ? 0 : Number(formData.kilometraje),
        id_cliente:   Number(formData.id_cliente),
      };

      if (id) {
        await axios.put(`/api/vehiculos/actualizar/${id}`, payload);
        toast.success('Vehículo actualizado');
      } else {
        await axios.post('/api/vehiculos/registrar', payload);
        toast.success('Vehículo registrado');
      }
      navigate('/admin/vehicles');
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo guardar el vehículo';
      toast.error(msg);
      if (String(err.response?.status) === '409') {
        setErrors(prev => ({ ...prev, placa: 'La placa ya existe' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{id ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h1>
        <div>
          <Link to="/admin/vehicles" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={onSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Marca <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="marca"
                    value={formData.marca}
                    onChange={onChange}
                    isInvalid={!!errors.marca}
                  />
                  <Form.Control.Feedback type="invalid">{errors.marca}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Modelo <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="modelo"
                    value={formData.modelo}
                    onChange={onChange}
                    isInvalid={!!errors.modelo}
                  />
                  <Form.Control.Feedback type="invalid">{errors.modelo}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Placa <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="placa"
                    value={formData.placa}
                    onChange={onChange}
                    placeholder="P-123ABC"
                    isInvalid={!!errors.placa}
                  />
                  <Form.Control.Feedback type="invalid">{errors.placa}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Año</Form.Label>
                  <Form.Control
                    type="number"
                    name="anio"
                    value={formData.anio}
                    onChange={onChange}
                    min={1900}
                    max={currentYear + 1}
                    isInvalid={!!errors.anio}
                  />
                  <Form.Control.Feedback type="invalid">{errors.anio}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    name="color"
                    value={formData.color}
                    onChange={onChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Número de serie</Form.Label>
                  <Form.Control
                    name="numero_serie"
                    value={formData.numero_serie}
                    onChange={onChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Kilometraje</Form.Label>
                  <Form.Control
                    type="number"
                    name="kilometraje"
                    value={formData.kilometraje}
                    onChange={onChange}
                    min={0}
                    step={1}
                    isInvalid={!!errors.kilometraje}
                  />
                  <Form.Control.Feedback type="invalid">{errors.kilometraje}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Cliente <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="id_cliente"
                    value={formData.id_cliente}       // ← queda seleccionado el id_cliente del vehículo
                    onChange={onChange}
                    isInvalid={!!errors.id_cliente}
                    disabled={loadingClients}
                  >
                    <option value="">
                      {loadingClients ? 'Cargando clientes...' : 'Seleccione un cliente'}
                    </option>
                    {clients.map(c => (
                      <option key={c.id_usuario} value={c.id_usuario}>
                        {c.nombre_usuario} (ID: {c.id_usuario})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.id_cliente}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" as="span" animation="border" className="me-2" />
                    Guardando...
                  </>
                ) : (id ? 'Actualizar' : 'Registrar')}
              </Button>
              <Link to="/admin/vehicles" className="btn btn-outline-secondary">Cancelar</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
