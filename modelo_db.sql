-- =================================================================
-- SCRIPT SQL - SISTEMA DE GESTION DE TALLER MECANICO
-- Base de datos: MySQL 8.0+
-- =================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sistema_taller_mecanico 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sistema_taller_mecanico;

-- =================================================================
-- TABLAS PRINCIPALES - PERSONAS Y USUARIOS
-- =================================================================

-- Tabla de personas
CREATE TABLE persona (
    id_persona INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dpi VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    direccion TEXT,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dpi (dpi),
    INDEX idx_estado (estado)
);

-- Contactos de personas
CREATE TABLE contacto_persona (
    id_contacto INT PRIMARY KEY AUTO_INCREMENT,
    id_persona INT NOT NULL,
    correo VARCHAR(150),
    telefono VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES persona(id_persona) ON DELETE CASCADE,
    INDEX idx_persona (id_persona),
    INDEX idx_correo (correo)
);

-- Roles del sistema
CREATE TABLE rol (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios del sistema
CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_persona INT NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL, -- Para hash de contraseña
    id_rol INT NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') DEFAULT 'ACTIVO',
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES persona(id_persona) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    INDEX idx_username (nombre_usuario),
    INDEX idx_estado (estado)
);

-- =================================================================
-- SISTEMA DE AUTENTICACION Y SEGURIDAD
-- =================================================================

-- Tokens de autenticación (2FA, recuperación)
CREATE TABLE token_autenticacion (
    id_token INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    tipo_token ENUM('2FA', 'RECUPERACION_PASSWORD') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    estado ENUM('ACTIVO', 'USADO', 'EXPIRADO') DEFAULT 'ACTIVO',
    codigo_verificacion VARCHAR(10),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario_tipo (id_usuario, tipo_token),
    INDEX idx_estado (estado)
);

-- Historial de intentos de login
CREATE TABLE historial_login (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv6 compatible
    resultado ENUM('EXITOSO', 'FALLIDO') NOT NULL,
    tipo_fallo ENUM('PASSWORD_INCORRECTO', 'USUARIO_BLOQUEADO', 'USUARIO_INACTIVO', '2FA_FALLIDO') NULL,
    navegador VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    INDEX idx_usuario_fecha (id_usuario, fecha_intento),
    INDEX idx_resultado (resultado)
);

-- =================================================================
-- GESTION DE ESPECIALISTAS Y TECNICOS
-- =================================================================

-- Tipos de técnicos
CREATE TABLE tipo_tecnico (
    id_tipo_tecnico INT PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Áreas de especialización
CREATE TABLE area_especialista (
    id_area_especialista INT PRIMARY KEY AUTO_INCREMENT,
    nombre_area VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación usuarios-especialistas
CREATE TABLE usuario_especialista (
    id_usuario_especialista INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_tipo_tecnico INT NOT NULL,
    id_area_especialista INT NOT NULL, -- Corregido nombre
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_tecnico) REFERENCES tipo_tecnico(id_tipo_tecnico),
    FOREIGN KEY (id_area_especialista) REFERENCES area_especialista(id_area_especialista),
    UNIQUE KEY uk_usuario_tipo_area (id_usuario, id_tipo_tecnico, id_area_especialista)
);

-- =================================================================
-- GESTION DE VEHICULOS
-- =================================================================

-- Vehículos de clientes
CREATE TABLE vehiculo (
    id_vehiculo INT PRIMARY KEY AUTO_INCREMENT,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    placa VARCHAR(20) NOT NULL UNIQUE,
    anio YEAR,
    color VARCHAR(50),
    numero_serie VARCHAR(100),
    kilometraje INT DEFAULT 0,
    id_cliente INT NOT NULL, -- Referencia a usuario con rol cliente
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    INDEX idx_placa (placa),
    INDEX idx_cliente (id_cliente),
    INDEX idx_marca_modelo (marca, modelo)
);

-- =================================================================
-- GESTION DE INVENTARIO Y PROVEEDORES
-- =================================================================

-- Proveedores (referencia a usuarios)
CREATE TABLE proveedor (
    id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    nit VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_estado (estado)
);

-- Repuestos
CREATE TABLE repuesto (
    id_repuesto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    codigo_parte VARCHAR(100),
    marca_compatible VARCHAR(100),
    id_proveedor INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('ACTIVO', 'DESCONTINUADO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    INDEX idx_nombre (nombre),
    INDEX idx_codigo (codigo_parte),
    INDEX idx_proveedor (id_proveedor)
);

-- Inventario de repuestos
CREATE TABLE inventario (
    id_inventario_repuesto INT PRIMARY KEY AUTO_INCREMENT,
    id_repuesto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_repuesto) REFERENCES repuesto(id_repuesto) ON DELETE CASCADE,
    INDEX idx_repuesto (id_repuesto),
    INDEX idx_cantidad (cantidad)
);

-- =================================================================
-- GESTION DE SERVICIOS Y TRABAJOS
-- =================================================================

-- Tipos de mantenimiento
CREATE TABLE tipo_mantenimiento (
    id_tipo_trabajo INT PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    tiempo_estimado INT, -- En minutos
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'
);

-- Registro de servicios de vehículos
CREATE TABLE registro_servicio_vehiculo (
    id_registro INT PRIMARY KEY AUTO_INCREMENT,
    id_vehiculo INT NOT NULL,
    descripcion_problema TEXT NOT NULL,
    calificacion TINYINT CHECK (calificacion BETWEEN 1 AND 5),
    estado ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO') DEFAULT 'PENDIENTE',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada_finalizacion TIMESTAMP,
    fecha_finalizacion_real TIMESTAMP NULL,
    observaciones_iniciales TEXT,
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') DEFAULT 'MEDIA',
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo),
    INDEX idx_vehiculo (id_vehiculo),
    INDEX idx_estado (estado),
    INDEX idx_fecha_ingreso (fecha_ingreso)
);

-- Asignación de trabajos
CREATE TABLE asignacion_trabajo (
    id_asignacion_trabajo INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_trabajo INT NOT NULL,
    id_registro INT NOT NULL,
    id_usuario_empleado INT NOT NULL,
    id_admin_asignacion INT NOT NULL,
    estado ENUM('ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'PAUSADO') DEFAULT 'ASIGNADO',
    descripcion TEXT,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_real TIMESTAMP NULL,
    fecha_finalizacion TIMESTAMP NULL,
    precio DECIMAL(10,2),
    observaciones_finalizacion TEXT,
    FOREIGN KEY (id_tipo_trabajo) REFERENCES tipo_mantenimiento(id_tipo_trabajo),
    FOREIGN KEY (id_registro) REFERENCES registro_servicio_vehiculo(id_registro) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_empleado) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_admin_asignacion) REFERENCES usuario(id_usuario),
    INDEX idx_empleado (id_usuario_empleado),
    INDEX idx_registro (id_registro),
    INDEX idx_estado (estado)
);

-- =================================================================
-- SISTEMA DE FACTURACION Y PAGOS
-- =================================================================

-- Facturas de servicios
CREATE TABLE factura_servicio_vehiculo (
    id_factura INT PRIMARY KEY AUTO_INCREMENT,
    id_registro INT NOT NULL,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado_pago ENUM('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO') DEFAULT 'PENDIENTE',
    metodo_pago_preferido ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'),
    observaciones TEXT,
    FOREIGN KEY (id_registro) REFERENCES registro_servicio_vehiculo(id_registro),
    INDEX idx_numero_factura (numero_factura),
    INDEX idx_registro (id_registro),
    INDEX idx_estado_pago (estado_pago)
);

-- Pagos de facturas
CREATE TABLE pagos_factura (
    id_pago INT PRIMARY KEY AUTO_INCREMENT,
    id_factura INT NOT NULL,
    monto_pago DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE') NOT NULL,
    referencia_pago VARCHAR(100),
    id_usuario_registro INT NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_factura) REFERENCES factura_servicio_vehiculo(id_factura) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_registro) REFERENCES usuario(id_usuario),
    INDEX idx_factura (id_factura),
    INDEX idx_fecha_pago (fecha_pago)
);

-- =================================================================
-- FUNCIONALIDADES DE EMPLEADOS
-- =================================================================

-- Observaciones del proceso de trabajo
CREATE TABLE observaciones_proceso_trabajo (
    id_observacion INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    observacion TEXT NOT NULL,
    fecha_observacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Síntomas detectados
CREATE TABLE sintomas_detectados (
    id_sintoma INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    fecha_sintoma TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion_sintoma TEXT NOT NULL,
    severidad ENUM('LEVE', 'MODERADO', 'SEVERO') DEFAULT 'MODERADO',
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Imprevistos en trabajos
CREATE TABLE imprevistos_trabajo (
    id_imprevisto INT PRIMARY KEY AUTO_INCREMENT, -- Corregido nombre
    id_asignacion_trabajo INT NOT NULL,
    fecha_imprevisto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion_imprevisto TEXT NOT NULL,
    impacto_tiempo INT, -- Minutos adicionales
    impacto_costo DECIMAL(10,2), -- Costo adicional
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Daños adicionales detectados
CREATE TABLE danios_adicionales (
    id_danio INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    descripcion_danio TEXT NOT NULL,
    fecha_danio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    costo_estimado DECIMAL(10,2),
    requiere_autorizacion BOOLEAN DEFAULT TRUE,
    autorizado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Avances de trabajos
CREATE TABLE avances_trabajo (
    id_avance INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    descripcion TEXT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    porcentaje TINYINT NOT NULL CHECK (porcentaje BETWEEN 0 AND 100),
    fecha_avance TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Solicitudes de apoyo de especialistas
CREATE TABLE solicitud_apoyo (
    id_solicitud_apoyo INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    id_usuario_especialista INT NOT NULL,
    descripcion_apoyo TEXT NOT NULL,
    fecha_apoyo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'COMPLETADO') DEFAULT 'PENDIENTE',
    fecha_respuesta TIMESTAMP NULL,
    observaciones_respuesta TEXT,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_especialista) REFERENCES usuario(id_usuario),
    INDEX idx_asignacion (id_asignacion_trabajo),
    INDEX idx_especialista (id_usuario_especialista)
);

-- Mantenimientos adicionales solicitados
CREATE TABLE mantenimiento_adicional (
    id_mantenimiento_adicional INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    id_tipo_trabajo INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO') DEFAULT 'PENDIENTE',
    costo_estimado DECIMAL(10,2),
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_trabajo) REFERENCES tipo_mantenimiento(id_tipo_trabajo),
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Solicitudes de uso de repuestos
CREATE TABLE solicitud_uso_repuesto (
    id_solicitud_uso_repuesto INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    cantidad INT NOT NULL,
    estado ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'USADO') DEFAULT 'PENDIENTE',
    id_usuario_aceptacion INT,
    id_inventario_repuesto INT NOT NULL,
    fecha_aprobacion TIMESTAMP NULL,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_aceptacion) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_inventario_repuesto) REFERENCES inventario(id_inventario_repuesto),
    INDEX idx_asignacion (id_asignacion_trabajo),
    INDEX idx_estado (estado)
);

-- =================================================================
-- FUNCIONALIDADES DE ESPECIALISTAS
-- =================================================================

-- Diagnósticos de especialistas
CREATE TABLE diagnostico_especialista (
    id_diagnostico_especialista INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    id_usuario_especialista INT NOT NULL,
    fecha_diagnostico TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones_generales TEXT,
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_especialista) REFERENCES usuario(id_usuario),
    INDEX idx_asignacion (id_asignacion_trabajo),
    INDEX idx_especialista (id_usuario_especialista)
);

-- Detalles de diagnósticos
CREATE TABLE detalle_diagnostico (
    id_detalle_diagnostico INT PRIMARY KEY AUTO_INCREMENT,
    id_diagnostico_especialista INT NOT NULL,
    tipo_diagnostico VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    severidad ENUM('LEVE', 'MODERADO', 'SEVERO', 'CRITICO') DEFAULT 'MODERADO',
    FOREIGN KEY (id_diagnostico_especialista) REFERENCES diagnostico_especialista(id_diagnostico_especialista) ON DELETE CASCADE,
    INDEX idx_diagnostico (id_diagnostico_especialista)
);

-- Pruebas técnicas realizadas
CREATE TABLE prueba_tecnica_especialista (
    id_prueba_tecnica INT PRIMARY KEY AUTO_INCREMENT,
    id_especialista INT NOT NULL,
    id_asignacion_trabajo INT NOT NULL,
    descripcion_prueba_tecnica TEXT NOT NULL,
    fecha_prueba TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_especialista) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    INDEX idx_especialista (id_especialista),
    INDEX idx_asignacion (id_asignacion_trabajo)
);

-- Resultados de pruebas técnicas
CREATE TABLE resultado_prueba_tecnica (
    id_resultado_prueba INT PRIMARY KEY AUTO_INCREMENT,
    id_prueba_tecnica INT NOT NULL,
    descripcion_resultado TEXT NOT NULL,
    fecha_resultado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado_satisfactorio BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_prueba_tecnica) REFERENCES prueba_tecnica_especialista(id_prueba_tecnica) ON DELETE CASCADE,
    INDEX idx_prueba (id_prueba_tecnica)
);

-- Soluciones propuestas
CREATE TABLE solucion_propuesta (
    id_solucion INT PRIMARY KEY AUTO_INCREMENT,
    id_resultado_prueba INT NOT NULL,
    descripcion_solucion TEXT NOT NULL,
    costo_estimado DECIMAL(10,2),
    tiempo_estimado INT, -- En minutos
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') DEFAULT 'MEDIA',
    fecha_propuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_resultado_prueba) REFERENCES resultado_prueba_tecnica(id_resultado_prueba) ON DELETE CASCADE,
    INDEX idx_resultado (id_resultado_prueba)
);

-- Comentarios de especialistas sobre vehículos
CREATE TABLE comentarios_vehiculo_especialista (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    id_especialista INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_comentario ENUM('OBSERVACION', 'RECOMENDACION', 'ADVERTENCIA') DEFAULT 'OBSERVACION',
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_especialista) REFERENCES usuario(id_usuario),
    INDEX idx_asignacion (id_asignacion_trabajo),
    INDEX idx_especialista (id_especialista)
);

-- Recomendaciones de vehículos
CREATE TABLE recomendaciones_vehiculo (
    id_recomendacion INT PRIMARY KEY AUTO_INCREMENT,
    id_asignacion_trabajo INT NOT NULL,
    id_especialista INT NOT NULL,
    recomendacion TEXT NOT NULL,
    fecha_recomendacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') DEFAULT 'MEDIA',
    tipo_recomendacion ENUM('MANTENIMIENTO_PREVENTIVO', 'REPARACION_FUTURA', 'CAMBIO_HABITOS') DEFAULT 'MANTENIMIENTO_PREVENTIVO',
    FOREIGN KEY (id_asignacion_trabajo) REFERENCES asignacion_trabajo(id_asignacion_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_especialista) REFERENCES usuario(id_usuario),
    INDEX idx_asignacion (id_asignacion_trabajo),
    INDEX idx_especialista (id_especialista)
);

-- Sugerencias de repuestos por especialistas
CREATE TABLE sugerir_repuesto (
    id_sugerencia_repuesto INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitud_uso_repuesto INT NOT NULL,
    id_inventario_repuesto INT NOT NULL,
    cantidad INT NOT NULL,
    estado ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
    fecha_sugerencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion_sugerencia TEXT,
    justificacion TEXT,
    FOREIGN KEY (id_solicitud_uso_repuesto) REFERENCES solicitud_uso_repuesto(id_solicitud_uso_repuesto) ON DELETE CASCADE,
    FOREIGN KEY (id_inventario_repuesto) REFERENCES inventario(id_inventario_repuesto),
    INDEX idx_solicitud (id_solicitud_uso_repuesto),
    INDEX idx_estado (estado)
);

-- =================================================================
-- FUNCIONALIDADES DE CLIENTES
-- =================================================================

-- Comentarios de seguimiento de clientes
CREATE TABLE comentarios_seguimiento_cliente (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    id_registro INT NOT NULL,
    id_cliente INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_comentario ENUM('CONSULTA', 'QUEJA', 'SUGERENCIA', 'AGRADECIMIENTO') DEFAULT 'CONSULTA',
    FOREIGN KEY (id_registro) REFERENCES registro_servicio_vehiculo(id_registro) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    INDEX idx_registro (id_registro),
    INDEX idx_cliente (id_cliente)
);

-- Servicios adicionales solicitados por clientes
CREATE TABLE servicios_adicionales (
    id_servicio_adicional INT PRIMARY KEY AUTO_INCREMENT,
    id_registro INT NOT NULL,
    id_tipo_trabajo INT NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO', 'COMPLETADO') DEFAULT 'SOLICITADO',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    costo_estimado DECIMAL(10,2),
    FOREIGN KEY (id_registro) REFERENCES registro_servicio_vehiculo(id_registro) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_trabajo) REFERENCES tipo_mantenimiento(id_tipo_trabajo),
    INDEX idx_registro (id_registro),
    INDEX idx_estado (estado)
);

-- Cotizaciones de servicios para vehículos
CREATE TABLE cotizacion_servicio_vehiculo (
    id_registro_cotizacion INT PRIMARY KEY AUTO_INCREMENT,
    id_vehiculo INT NOT NULL,
    descripcion_problema TEXT NOT NULL,
    estado ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
    fecha_cotizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    total_cotizacion DECIMAL(10,2),
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo),
    INDEX idx_vehiculo (id_vehiculo),
    INDEX idx_estado (estado)
);

-- Trabajos incluidos en cotizaciones
CREATE TABLE trabajos_cotizacion (
    id_trabajo_cotizacion INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_trabajo INT NOT NULL,
    id_registro_cotizacion INT NOT NULL,
    estado ENUM('INCLUIDO', 'OPCIONAL', 'EXCLUIDO') DEFAULT 'INCLUIDO',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion DATE,
    precio DECIMAL(10,2) NOT NULL,
    descripcion_trabajo TEXT,
    FOREIGN KEY (id_tipo_trabajo) REFERENCES tipo_mantenimiento(id_tipo_trabajo),
    FOREIGN KEY (id_registro_cotizacion) REFERENCES cotizacion_servicio_vehiculo(id_registro_cotizacion) ON DELETE CASCADE,
    INDEX idx_cotizacion (id_registro_cotizacion)
);

-- =================================================================
-- FUNCIONALIDADES DE PROVEEDORES
-- =================================================================

-- Catálogo de productos de proveedores
CREATE TABLE catalogo_proveedor (
    id_catalogo INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT NOT NULL,
    id_repuesto INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    cantidad_disponible INT DEFAULT 0,
    tiempo_entrega INT, -- En días
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('DISPONIBLE', 'AGOTADO', 'DESCONTINUADO') DEFAULT 'DISPONIBLE',
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE CASCADE,
    FOREIGN KEY (id_repuesto) REFERENCES repuesto(id_repuesto),
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_repuesto (id_repuesto),
    INDEX idx_estado (estado)
);

-- Pedidos a proveedores
CREATE TABLE pedido_proveedor (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT NOT NULL,
    numero_pedido VARCHAR(50) UNIQUE,
    total DECIMAL(10,2) NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_solicitada DATE,
    estado ENUM('PENDIENTE', 'CONFIRMADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_estado (estado),
    INDEX idx_numero_pedido (numero_pedido)
);

-- Detalles de pedidos
CREATE TABLE detalle_pedido (
    id_detalle_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_catalogo INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido_proveedor(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_catalogo) REFERENCES catalogo_proveedor(id_catalogo),
    INDEX idx_pedido (id_pedido)
);

-- Entregas de pedidos
CREATE TABLE entrega_pedido (
    id_entrega INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    fecha_entrega_real TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_entrega ENUM('PENDIENTE', 'PARCIAL', 'COMPLETA', 'RETRASADA') DEFAULT 'PENDIENTE',
    observaciones_entrega TEXT,
    id_usuario_recibe INT NOT NULL,
    documento_entrega VARCHAR(100), -- Número de guía o documento
    FOREIGN KEY (id_pedido) REFERENCES pedido_proveedor(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_recibe) REFERENCES usuario(id_usuario),
    INDEX idx_pedido (id_pedido),
    INDEX idx_estado_entrega (estado_entrega)
);

-- Pagos a proveedores
CREATE TABLE pagos_proveedor (
    id_pago_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA') NOT NULL,
    referencia VARCHAR(100),
    estado ENUM('PENDIENTE', 'PAGADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    id_usuario_registro INT NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido_proveedor(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_registro) REFERENCES usuario(id_usuario),
    INDEX idx_pedido (id_pedido),
    INDEX idx_estado (estado),
    INDEX idx_fecha_pago (fecha_pago)
);

-- Artículos sugeridos por proveedores
CREATE TABLE articulos_sugeridos (
    id_sugerencia_articulo INT PRIMARY KEY AUTO_INCREMENT,
    nombre_articulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    estado ENUM('PENDIENTE', 'EVALUADO', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
    id_proveedor INT NOT NULL,
    fecha_sugerencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(100),
    marca_compatible VARCHAR(100),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE CASCADE,
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_estado (estado)
);

-- Cotizaciones de productos
CREATE TABLE cotizacion_productos (
    id_cotizacion INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT NOT NULL,
    numero_cotizacion VARCHAR(50) UNIQUE,
    fecha_cotizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    estado ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO') DEFAULT 'PENDIENTE',
    total DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    id_usuario_solicita INT NOT NULL,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_solicita) REFERENCES usuario(id_usuario),
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_estado (estado),
    INDEX idx_numero_cotizacion (numero_cotizacion)
);

-- Detalles de cotizaciones
CREATE TABLE detalle_cotizacion (
    id_detalle_cotizacion INT PRIMARY KEY AUTO_INCREMENT,
    id_cotizacion INT NOT NULL,
    id_catalogo INT NOT NULL,
    precio_cotizado DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizacion_productos(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_catalogo) REFERENCES catalogo_proveedor(id_catalogo),
    INDEX idx_cotizacion (id_cotizacion)
);

