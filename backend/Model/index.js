const sequelize = require('../config/sequelize');

const Persona = require('./persona');
const ContactoPersona = require('./ContactoPersona');
const Rol = require('./rol');
const Usuario = require('./usuario');
const TokenAutenticacion = require('./TokenAutenticacion');
const HistorialLogin = require('./HistorialLogin');

//GESTION DE ESPECIALISTAS Y TECNICOS
const TipoTecnico = require('./TipoTecnico'); 
const AreaEspecialista = require('./AreaEspecialista');
const UsuarioEspecialista = require('./UsuarioEspecialista');

//GESTION DE VEHICULOS
const Vehiculo = require('./Vehiculo');

//GESTION DE INVENTARIO Y PROVEEDORES
const Proveedor = require('./Proveedor');
const Repuesto = require('./Repuesto');
const Inventario = require('./Inventario');


//GESTION DE SERVICIOS Y TRABAJOS
const TipoMantenimiento = require('./TipoMantenimiento');
const RegistroServicioVehiculo = require('./RegistroServicioVehiculo');
const AsignacionTrabajo = require('./AsignacionTrabajo');


//SISTEMA DE FACTURACION Y PAGOS
const FacturaServicioVehiculo = require('./FacturaServicioVehiculo');
const PagosFactura = require('./PagosFactura');

//FUNCIONALIDADES DE EMPLEADOS
const ObservacionesProcesoTrabajo = require('./ObservacionesProcesoTrabajo');
const SintomasDetectados = require('./SintomasDetectados');
const ImprevistosTrabajo = require('./ImprevistosTrabajo');
const DaniosAdicionales = require('./DaniosAdicionales');
const AvancesTrabajo = require('./AvancesTrabajo');
const SolicitudApoyo = require('./SolicitudApoyo');
const MantenimientoAdicional = require('./MantenimientoAdicional');
const SolicitudUsoRepuesto = require('./SolicitudUsoRepuesto');

//FUNCIONALIDADES DE ESPECIALISTAS
const DiagnosticoEspecialista = require('./DiagnosticoEspecialista');
const DetalleDiagnostico = require('./DetalleDiagnostico');
const PruebaTecnicaEspecialista = require('./PruebaTecnicaEspecialista');
const ResultadoPruebaTecnica = require('./ResultadoPruebaTecnica');
const SolucionPropuesta = require('./SolucionPropuesta');
const ComentariosVehiculoEspecialista = require('./ComentariosVehiculoEspecialista');
const RecomendacionesVehiculo = require('./RecomendacionesVehiculo');
const SugerirRepuesto = require('./SugerirRepuesto');


// FUNCIONALIDADES CLIENTES
const ComentariosSeguimientoCliente = require('./ComentariosSeguimientoCliente');
const ServiciosAdicionales = require('./ServiciosAdicionales');
const CotizacionServicioVehiculo = require('./CotizacionServicioVehiculo');
const TrabajosCotizacion = require('./TrabajosCotizacion');


//FUNCIONALIDADES DE PROVEEDORES
const CatalogoProveedor = require('./CatalogoProveedor');
const PedidoProveedor = require('./PedidoProveedor');
const DetallePedido = require('./DetallePedido');
const EntregaPedido = require('./EntregaPedido');
const PagosProveedor = require('./PagosProveedor');
const ArticulosSugeridos = require('./ArticulosSugeridos');
const CotizacionProductos = require('./CotizacionProductos');
const DetalleCotizacion = require('./DetalleCotizacion');


// Definición de relaciones

//Una persona tiene muchos contactos
Persona.hasMany(ContactoPersona, { foreignKey: 'id_persona', sourceKey: 'id_persona' });
ContactoPersona.belongsTo(Persona, { foreignKey: 'id_persona', targetKey: 'id_persona' });

//Un usuario pertenece a una persona
Usuario.belongsTo(Persona, { foreignKey: 'id_persona', targetKey: 'id_persona' });

//Usuario tiene un rol
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', targetKey: 'id_rol' });

//Un usuario tiene un token de autenticación
TokenAutenticacion.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

//Un usuario tiene muchos historiales de login
HistorialLogin.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

/*
========================================================
  Relaciones de GESTION DE ESPECIALISTAS Y TECNICOS
========================================================
*/
TipoTecnico.hasMany(UsuarioEspecialista, { foreignKey: 'id_tipo_tecnico', sourceKey: 'id_tipo_tecnico' });
AreaEspecialista.hasMany(UsuarioEspecialista, { foreignKey: 'id_area_especialista', sourceKey: 'id_area_especialista' });
Usuario.hasMany(UsuarioEspecialista, { foreignKey: 'id_usuario', sourceKey: 'id_usuario' });
UsuarioEspecialista.belongsTo(TipoTecnico, { foreignKey: 'id_tipo_tecnico', targetKey: 'id_tipo_tecnico' });
UsuarioEspecialista.belongsTo(AreaEspecialista, { foreignKey: 'id_area_especialista', targetKey: 'id_area_especialista' });
UsuarioEspecialista.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

/*
========================================================
  Relaciones de GESTION DE VEHICULOS
========================================================
*/
Usuario.hasMany(Vehiculo, { foreignKey: 'id_cliente', sourceKey: 'id_usuario' });
Vehiculo.belongsTo(Usuario, { foreignKey: 'id_cliente', targetKey: 'id_usuario' });

/*
=======================================================
  Relaciones de GESTION DE INVENTARIO Y PROVEEDORES
=======================================================
*/
Usuario.hasMany(Proveedor, { foreignKey: 'id_usuario', sourceKey: 'id_usuario' });
Proveedor.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });
Proveedor.hasMany(Repuesto, { foreignKey: 'id_proveedor', sourceKey: 'id_proveedor' });
Repuesto.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor' });
Repuesto.hasMany(Inventario, { foreignKey: 'id_repuesto', sourceKey: 'id_repuesto' });
Inventario.belongsTo(Repuesto, { foreignKey: 'id_repuesto', targetKey: 'id_repuesto' });

/*
========================================================
  Relaciones de GESTION DE SERVICIOS Y TRABAJOS
=======================================================
*/
Vehiculo.hasMany(RegistroServicioVehiculo, { foreignKey: 'id_vehiculo', sourceKey: 'id_vehiculo' });
RegistroServicioVehiculo.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo', targetKey: 'id_vehiculo' });

TipoMantenimiento.hasMany(AsignacionTrabajo, { foreignKey: 'id_tipo_trabajo', sourceKey: 'id_tipo_trabajo' });
AsignacionTrabajo.belongsTo(TipoMantenimiento, { foreignKey: 'id_tipo_trabajo', targetKey: 'id_tipo_trabajo' });

RegistroServicioVehiculo.hasMany(AsignacionTrabajo, { foreignKey: 'id_registro', sourceKey: 'id_registro' });
AsignacionTrabajo.belongsTo(RegistroServicioVehiculo, { foreignKey: 'id_registro', targetKey: 'id_registro' });


Usuario.hasMany(AsignacionTrabajo, { foreignKey: 'id_usuario_empleado', sourceKey: 'id_usuario', as: 'empleadoAsignado' });
AsignacionTrabajo.belongsTo(Usuario, { foreignKey: 'id_usuario_empleado', targetKey: 'id_usuario', as: 'empleadoAsignado' });

Usuario.hasMany(AsignacionTrabajo, { foreignKey: 'id_admin_asignacion', sourceKey: 'id_usuario', as: 'adminAsignacion' });
AsignacionTrabajo.belongsTo(Usuario, { foreignKey: 'id_admin_asignacion', targetKey: 'id_usuario', as: 'adminAsignacion' });


// Relación para el administrador que asignó el trabajo
//Usuario.hasMany(AsignacionTrabajo, { foreignKey: 'id_admin_asignacion', sourceKey: 'id_usuario', as: 'asignacionesAdmin' });
//AsignacionTrabajo.belongsTo(Usuario, { foreignKey: 'id_admin_asignacion', targetKey: 'id_usuario', as: 'adminAsignacion' });

/*
==============================================
  Relaciones SISTEMA DE FACTURACION Y PAGOS
==============================================
*/
RegistroServicioVehiculo.hasMany(FacturaServicioVehiculo, { foreignKey: 'id_registro', sourceKey: 'id_registro' });
FacturaServicioVehiculo.belongsTo(RegistroServicioVehiculo, { foreignKey: 'id_registro', targetKey: 'id_registro' });

FacturaServicioVehiculo.hasMany(PagosFactura, { foreignKey: 'id_factura', sourceKey: 'id_factura' });
PagosFactura.belongsTo(FacturaServicioVehiculo, { foreignKey: 'id_factura', targetKey: 'id_factura' });

/*
==================================================
  Relaciones FUNCIONALIDADES DE EMPLEADOS
==================================================
*/
AsignacionTrabajo.hasMany(ObservacionesProcesoTrabajo, { foreignKey: 'id_asignacion', sourceKey: 'id_asignacion' });
ObservacionesProcesoTrabajo.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion', targetKey: 'id_asignacion' });

Usuario.hasMany(ObservacionesProcesoTrabajo, { foreignKey: 'id_usuario_registro', sourceKey: 'id_usuario' });
ObservacionesProcesoTrabajo.belongsTo(Usuario, { foreignKey: 'id_usuario_registro', targetKey: 'id_usuario' });

AsignacionTrabajo.hasMany(SintomasDetectados, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
SintomasDetectados.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });

AsignacionTrabajo.hasMany(ImprevistosTrabajo, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
ImprevistosTrabajo.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });

AsignacionTrabajo.hasMany(DaniosAdicionales, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
DaniosAdicionales.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });

AsignacionTrabajo.hasMany(AvancesTrabajo, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
AvancesTrabajo.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });

AsignacionTrabajo.hasMany(SolicitudApoyo, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
SolicitudApoyo.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
Usuario.hasMany(SolicitudApoyo, { foreignKey: 'id_usuario_especialista', sourceKey: 'id_usuario' });
SolicitudApoyo.belongsTo(Usuario, { foreignKey: 'id_usuario_especialista', targetKey: 'id_usuario' });

AsignacionTrabajo.hasMany(MantenimientoAdicional, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
MantenimientoAdicional.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
TipoMantenimiento.hasMany(MantenimientoAdicional, { foreignKey: 'id_tipo_trabajo', sourceKey: 'id_tipo_trabajo' });
MantenimientoAdicional.belongsTo(TipoMantenimiento, { foreignKey: 'id_tipo_trabajo', targetKey: 'id_tipo_trabajo' });

AsignacionTrabajo.hasMany(SolicitudUsoRepuesto, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
SolicitudUsoRepuesto.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
Usuario.hasMany(SolicitudUsoRepuesto, { foreignKey: 'id_usuario_aceptacion', sourceKey: 'id_usuario' });
SolicitudUsoRepuesto.belongsTo(Usuario, { foreignKey: 'id_usuario_aceptacion', targetKey: 'id_usuario' });
Inventario.hasMany(SolicitudUsoRepuesto, { foreignKey: 'id_inventario_repuesto', sourceKey: 'id_inventario_repuesto' });
SolicitudUsoRepuesto.belongsTo(Inventario, { foreignKey: 'id_inventario_repuesto', targetKey: 'id_inventario_repuesto' });

/*
-- =================================================================
-- FUNCIONALIDADES DE ESPECIALISTAS
-- =================================================================
*/
AsignacionTrabajo.hasMany(DiagnosticoEspecialista, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
DiagnosticoEspecialista.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
Usuario.hasMany(DiagnosticoEspecialista, { foreignKey: 'id_usuario_especialista', sourceKey: 'id_usuario' });
DiagnosticoEspecialista.belongsTo(Usuario, { foreignKey: 'id_usuario_especialista', targetKey: 'id_usuario' });

DiagnosticoEspecialista.hasMany(DetalleDiagnostico, { foreignKey: 'id_diagnostico_especialista', sourceKey: 'id_diagnostico_especialista' });
DetalleDiagnostico.belongsTo(DiagnosticoEspecialista, { foreignKey: 'id_diagnostico_especialista', targetKey: 'id_diagnostico_especialista' });

Usuario.hasMany(PruebaTecnicaEspecialista, { foreignKey: 'id_usuario_especialista', sourceKey: 'id_usuario' });
PruebaTecnicaEspecialista.belongsTo(Usuario, { foreignKey: 'id_usuario_especialista', targetKey: 'id_usuario' });
AsignacionTrabajo.hasMany(PruebaTecnicaEspecialista, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
PruebaTecnicaEspecialista.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });


PruebaTecnicaEspecialista.hasMany(ResultadoPruebaTecnica, { foreignKey: 'id_prueba_tecnica', sourceKey: 'id_prueba_tecnica' });
ResultadoPruebaTecnica.belongsTo(PruebaTecnicaEspecialista, { foreignKey: 'id_prueba_tecnica', targetKey: 'id_prueba_tecnica' });

ResultadoPruebaTecnica.hasMany(SolucionPropuesta, { foreignKey: 'id_resultado_prueba', sourceKey: 'id_resultado_prueba' });
SolucionPropuesta.belongsTo(ResultadoPruebaTecnica, { foreignKey: 'id_resultado_prueba', targetKey: 'id_resultado_prueba' });

AsignacionTrabajo.hasMany(ComentariosVehiculoEspecialista, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
ComentariosVehiculoEspecialista.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
Usuario.hasMany(ComentariosVehiculoEspecialista, { foreignKey: 'id_especialista', sourceKey: 'id_usuario' });
ComentariosVehiculoEspecialista.belongsTo(Usuario, { foreignKey: 'id_especialista', targetKey: 'id_usuario' });

AsignacionTrabajo.hasMany(RecomendacionesVehiculo, { foreignKey: 'id_asignacion_trabajo', sourceKey: 'id_asignacion' });
RecomendacionesVehiculo.belongsTo(AsignacionTrabajo, { foreignKey: 'id_asignacion_trabajo', targetKey: 'id_asignacion' });
Usuario.hasMany(RecomendacionesVehiculo, { foreignKey: 'id_especialista', sourceKey: 'id_usuario' });
RecomendacionesVehiculo.belongsTo(Usuario, { foreignKey: 'id_especialista', targetKey: 'id_usuario' });

SolicitudUsoRepuesto.hasMany(SugerirRepuesto, { foreignKey: 'id_solicitud_uso_repuesto', sourceKey: 'id_solicitud_uso_repuesto' });
SugerirRepuesto.belongsTo(SolicitudUsoRepuesto, { foreignKey: 'id_solicitud_uso_repuesto', targetKey: 'id_solicitud_uso_repuesto' });
Inventario.hasMany(SugerirRepuesto, { foreignKey: 'id_inventario_repuesto', sourceKey: 'id_inventario_repuesto' });
SugerirRepuesto.belongsTo(Inventario, { foreignKey: 'id_inventario_repuesto', targetKey: 'id_inventario_repuesto' });


/*
-- =================================================================
-- FUNCIONALIDADES DE CLIENTES
-- =================================================================
*/

RegistroServicioVehiculo.hasMany(ComentariosSeguimientoCliente, { foreignKey: 'id_registro', sourceKey: 'id_registro' });
ComentariosSeguimientoCliente.belongsTo(RegistroServicioVehiculo, { foreignKey: 'id_registro', targetKey: 'id_registro' });
Usuario.hasMany(ComentariosSeguimientoCliente, { foreignKey: 'id_cliente', sourceKey: 'id_usuario' });
ComentariosSeguimientoCliente.belongsTo(Usuario, { foreignKey: 'id_cliente', targetKey: 'id_usuario' });

RegistroServicioVehiculo.hasMany(ServiciosAdicionales, { foreignKey: 'id_registro', sourceKey: 'id_registro' });
ServiciosAdicionales.belongsTo(RegistroServicioVehiculo, { foreignKey: 'id_registro', targetKey: 'id_registro' });
TipoMantenimiento.hasMany(ServiciosAdicionales, { foreignKey: 'id_tipo_trabajo', sourceKey: 'id_tipo_trabajo' });
ServiciosAdicionales.belongsTo(TipoMantenimiento, { foreignKey: 'id_tipo_trabajo', targetKey: 'id_tipo_trabajo' });

Vehiculo.hasMany(CotizacionServicioVehiculo, { foreignKey: 'id_vehiculo', sourceKey: 'id_vehiculo' });
CotizacionServicioVehiculo.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo', targetKey: 'id_vehiculo' });

TipoMantenimiento.hasMany(TrabajosCotizacion, { foreignKey: 'id_tipo_trabajo', sourceKey: 'id_tipo_trabajo' });
TrabajosCotizacion.belongsTo(TipoMantenimiento, { foreignKey: 'id_tipo_trabajo', targetKey: 'id_tipo_trabajo' });
CotizacionServicioVehiculo.hasMany(TrabajosCotizacion, { foreignKey: 'id_registro_cotizacion', sourceKey: 'id_registro_cotizacion' });
TrabajosCotizacion.belongsTo(CotizacionServicioVehiculo, { foreignKey: 'id_registro_cotizacion', targetKey: 'id_registro_cotizacion' });


/*
-- =================================================================
-- FUNCIONALIDADES DE PROVEEDORES
-- =================================================================
*/
Proveedor.hasMany(CatalogoProveedor, { foreignKey: 'id_proveedor', sourceKey: 'id_proveedor' });
CatalogoProveedor.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor' });
Repuesto.hasMany(CatalogoProveedor, { foreignKey: 'id_repuesto', sourceKey: 'id_repuesto' });
CatalogoProveedor.belongsTo(Repuesto, { foreignKey: 'id_repuesto', targetKey: 'id_repuesto' });

Proveedor.hasMany(PedidoProveedor, { foreignKey: 'id_proveedor', sourceKey: 'id_proveedor' });
PedidoProveedor.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor' });

PedidoProveedor.hasMany(DetallePedido, { foreignKey: 'id_pedido', sourceKey: 'id_pedido' });
DetallePedido.belongsTo(PedidoProveedor, { foreignKey: 'id_pedido', targetKey: 'id_pedido' });
CatalogoProveedor.hasMany(DetallePedido, { foreignKey: 'id_catalogo', sourceKey: 'id_catalogo' });
DetallePedido.belongsTo(CatalogoProveedor, { foreignKey: 'id_catalogo', targetKey: 'id_catalogo' });

PedidoProveedor.hasMany(EntregaPedido, { foreignKey: 'id_pedido', sourceKey: 'id_pedido' });
EntregaPedido.belongsTo(PedidoProveedor, { foreignKey: 'id_pedido', targetKey: 'id_pedido' });
Usuario.hasMany(EntregaPedido, { foreignKey: 'id_usuario_recibe', sourceKey: 'id_usuario' });
EntregaPedido.belongsTo(Usuario, { foreignKey: 'id_usuario_recibe', targetKey: 'id_usuario' });

PedidoProveedor.hasMany(PagosProveedor, { foreignKey: 'id_pedido', sourceKey: 'id_pedido' });
PagosProveedor.belongsTo(PedidoProveedor, { foreignKey: 'id_pedido', targetKey: 'id_pedido' });
Usuario.hasMany(PagosProveedor, { foreignKey: 'id_usuario_registro', sourceKey: 'id_usuario' });
PagosProveedor.belongsTo(Usuario, { foreignKey: 'id_usuario_registro', targetKey: 'id_usuario' });

Proveedor.hasMany(ArticulosSugeridos, { foreignKey: 'id_proveedor', sourceKey: 'id_proveedor' });
ArticulosSugeridos.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor' });

Proveedor.hasMany(CotizacionProductos, { foreignKey: 'id_proveedor', sourceKey: 'id_proveedor' });
CotizacionProductos.belongsTo(Proveedor, { foreignKey: 'id_proveedor', targetKey: 'id_proveedor' });
Usuario.hasMany(CotizacionProductos, { foreignKey: 'id_usuario_solicita', sourceKey: 'id_usuario' });
CotizacionProductos.belongsTo(Usuario, { foreignKey: 'id_usuario_solicita', targetKey: 'id_usuario' });

CotizacionProductos.hasMany(DetalleCotizacion, { foreignKey: 'id_cotizacion', sourceKey: 'id_cotizacion' });
DetalleCotizacion.belongsTo(CotizacionProductos, { foreignKey: 'id_cotizacion', targetKey: 'id_cotizacion' });
CatalogoProveedor.hasMany(DetalleCotizacion, { foreignKey: 'id_catalogo', sourceKey: 'id_catalogo' });
DetalleCotizacion.belongsTo(CatalogoProveedor, { foreignKey: 'id_catalogo', targetKey: 'id_catalogo' });


module.exports = {
  sequelize,
  Persona,
  ContactoPersona,
  Rol,
  Usuario,
  TokenAutenticacion,
  HistorialLogin,
  TipoTecnico,
  AreaEspecialista,
  UsuarioEspecialista,
  Vehiculo,
  Repuesto,
  AsignacionTrabajo,
  RegistroServicioVehiculo,
  TipoMantenimiento,
  ObservacionesProcesoTrabajo,
  SintomasDetectados,
  DaniosAdicionales,
  ImprevistosTrabajo,
  AvancesTrabajo,
  SolicitudApoyo,
  MantenimientoAdicional,
  SolicitudUsoRepuesto,
  DiagnosticoEspecialista,
  DetalleDiagnostico,
  PruebaTecnicaEspecialista,
  ResultadoPruebaTecnica,
  SolucionPropuesta,
  ComentariosVehiculoEspecialista,
  RecomendacionesVehiculo,
  SugerirRepuesto,
  ComentariosSeguimientoCliente,
  ServiciosAdicionales,
  CotizacionServicioVehiculo,
  TrabajosCotizacion,
  CatalogoProveedor,
  PedidoProveedor,
  DetallePedido,
  EntregaPedido,
  PagosProveedor,
  ArticulosSugeridos,
  CotizacionProductos,
  DetalleCotizacion,
  Proveedor
};