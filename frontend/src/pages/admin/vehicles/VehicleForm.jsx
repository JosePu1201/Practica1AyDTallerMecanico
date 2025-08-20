import React, { useEffect, useMemo, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// ⚠️ Temporal: lista estática de clientes (id_usuario, nombre, apellido, nombre_usuario)
const CLIENTES_STATIC = [
  { id_usuario: 7, nombre: 'Juan', apellido: 'Pérez', nombre_usuario: 'juanp' },
  { id_usuario: 6, nombre: 'María', apellido: 'López', nombre_usuario: 'mlopez' },
  { id_usuario: 5, nombre: 'Carlos', apellido: 'García', nombre_usuario: 'cgarcia' },
];

const ESTADOS = ['ACTIVO', 'INACTIVO'];

export default function VehicleForm() {
  const { id } = useParams(); // si existe => edición
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    modelo: '',
    marca: '',
    placa: '',
    anio: '',
    color: '',
    numero_serie: '',
    kilometraje: 0,
    id_cliente: '',
    estado: 'ACTIVO',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
    // Si más adelante cambias CLIENTES_STATIC por fetch a /api/users?role=CLIENTE,
    // hazlo aquí en otro efecto.
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/vehicles/${id}`);
      const v = res.data;

      setFormData({
        modelo: v?.modelo || '',
        marca: v?.marca || '',
        placa: v?.placa || '',
        anio: v?.anio || '',
        color: v?.color || '',
        numero_serie: v?.numero_serie || '',
        kilometraje: v?.kilometraje ?? 0,
        id_cliente: v?.id_cliente ?? '',
        estado: v?.estado || 'ACTIVO',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    let val = value;
    if (name === 'placa') {
      val = value.toUpperCase(); // normalizar a MAYÚSCULAS
    }
    if (name === 'kilometraje') {
      val = value === '' ? '' : Math.max(0, Number(value));
    }
    if (name === 'anio') {
      val = value === '' ? '' : Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const e = {};

    if (!formData.marca?.trim()) e.marca = 'La marca es obligatoria';
    if (!formData.modelo?.trim()) e.modelo = 'El modelo es obligatorio';

    if (!formData.placa?.trim()) {
      e.placa = 'La placa es obligatoria';
    } else if (!/^[A-Z0-9-]{3,20}$/.test(formData.placa)) {
      e.placa = 'Placa inválida (usa letras/números/guiones, 3-20)';
    }

    if (formData.anio !== '' && (formData.anio < 1900 || formData.anio > currentYear + 1)) {
      e.anio = `Año inválido (1900 - ${currentYear + 1})`;
    }

    if (formData.kilometraje !== '' && Number.isNaN(Number(formData.kilometraje))) {
      e.kilometraje = 'Kilometraje inválido';
    }

    if (!formData.id_cliente) e.id_cliente = 'Debe seleccionar un cliente';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (id) {
        await axios.put(`/api/vehicles/${id}`, {
          ...formData,
          anio: formData.anio === '' ? null : formData.anio,
          kilometraje: formData.kilometraje === '' ? 0 : Number(formData.kilometraje),
        });
        toast.success('Vehículo actualizado');
      } else {
        await axios.post('/api/vehicles', {
          ...formData,
          anio: formData.anio === '' ? null : formData.anio,
          kilometraje: formData.kilometraje === '' ? 0 : Number(formData.kilometraje),
        });
        toast.success('Vehículo registrado');
      }
      navigate('/admin/vehicles');
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo guardar el vehículo';
      toast.error(msg);
      // Manejo especial si backend devuelve conflicto por placa duplicada
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
              <Col md={3}>
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
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={onChange}
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cliente <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="id_cliente"
                    value={formData.id_cliente}
                    onChange={onChange}
                    isInvalid={!!errors.id_cliente}
                  >
                    <option value="">Seleccione un cliente</option>
                    {CLIENTES_STATIC.map(c => (
                      <option key={c.id_usuario} value={c.id_usuario}>
                        {c.nombre} {c.apellido} ({c.nombre_usuario})
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
