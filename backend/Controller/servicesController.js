const {Rol, TipoMantenimiento, Vehiculo, AsignacionTrabajo, RegistroServicioVehiculo} = require('../Model');
const {Usuario, UsuarioEspecialista, TipoTecnico, AreaEspecialista, Persona, sequelize} = require('../Model');


const getVehiclesWithClient = async (req, res) => {
    try {
        const vehicles = await Vehiculo.findAll({
            include: [
                {
                    model: Usuario,
                    where: { estado: 'ACTIVO' },
                    attributes: ['id_usuario', 'nombre_usuario'],
                    include: [
                        {
                            model: Persona,
                            attributes: ['id_persona', 'nombre', 'apellido']
                        }
                    ]
                }
            ]
        });
        res.json(vehicles);
    } catch (error) {
        console.error('Error al obtener vehículos con cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getTipoMantenimiento = async (req, res) => {
    try {
        const tipos = await TipoMantenimiento.findAll({
            where: { estado: 'ACTIVO' }
        });
        res.json(tipos);
    } catch (error) {
        console.error('Error al obtener tipos de mantenimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};



const addTipoMantenimiento = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { nombre_tipo, descripcion, precio_base, tiempo_estimado } = req.body;

        const nuevoTipo = await TipoMantenimiento.create({
            nombre_tipo,
            descripcion,
            precio_base,
            tiempo_estimado
        }, { transaction });

        await transaction.commit();
        res.status(201).json(nuevoTipo);
    } catch (error) {
        console.error('Error al agregar tipo de mantenimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const registerServiceVehicle = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_vehiculo, descripcion_problema, estado, fecha_estimada_finalizacion, observaciones_iniciales, prioridad } = req.body;

        const newService = await RegistroServicioVehiculo.create({
            id_vehiculo,
            descripcion_problema,
            estado,
            fecha_estimada_finalizacion,
            observaciones_iniciales,
            prioridad
        }, { transaction });


        await transaction.commit();
        res.status(201).json(newService);
    } catch (error) {
        await transaction.rollback();
        console.error('Error al registrar servicio de vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};




const getServices = async (req, res) => {
    try {
        const services = await RegistroServicioVehiculo.findAll({
            include: [
                {
                    model: Vehiculo,
                    attributes: ['id_vehiculo', 'marca', 'modelo', 'anio', 'placa', 'color'],
                    include: [
                        {
                            model: Usuario,
                            attributes: ['id_usuario', 'nombre_usuario'],
                            include: [
                                {
                                    model: Persona,
                                    attributes: ['id_persona', 'nombre', 'apellido']
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        res.json(services);
    } catch (error) {
        console.error('Error al obtener servicios de vehículos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const changeStateService = async (req, res) => {
    try {
        const { id_registro, estado } = req.body;

        const service = await RegistroServicioVehiculo.findByPk(id_registro);
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        service.estado = estado;
        await service.save();

        res.json(service);
    } catch (error) {
        console.error('Error al cambiar el estado del servicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}


const getAllEmployees = async (req, res) => {
    try {
        const employees = await Usuario.findAll({
            where: { estado: 'ACTIVO' },
            attributes: ['id_usuario', 'nombre_usuario'],
            include: [
                {
                    model: Persona,
                    attributes: ['id_persona', 'nombre', 'apellido']
                },
                {
                    model: Rol,
                    attributes: ['id_rol', 'nombre_rol'],
                    where: { nombre_rol: 'EMPLEADO' }
                }
            ]
        });
        res.json(employees);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAllSpecialists = async (req, res) => {
    try {
        const specialists = await UsuarioEspecialista.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: ['id_usuario', 'nombre_usuario'],
                    include: [
                        {
                            model: Persona,
                            attributes: ['id_persona', 'nombre', 'apellido']
                        }
                    ]
                },
                {
                    model: TipoTecnico,
                    attributes: ['id_tipo_tecnico', 'nombre_tipo']
                },
                {
                    model: AreaEspecialista,
                    attributes: ['id_area_especialista', 'nombre_area']
                }
            ]

        });
        res.json(specialists);
    } catch (error) {
        console.error('Error al obtener especialistas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const assignWork = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_tipo_trabajo, id_registro, id_usuario_empleado, id_admin_asignacion, descripcion, precio } = req.body;
        
        const newAssignment = await AsignacionTrabajo.create({
            id_tipo_trabajo,
            id_registro,
            id_usuario_empleado,
            id_admin_asignacion,
            descripcion,
            precio
            //observaciones_finalizacion
        },{transaction} );

        await transaction.commit();
        res.status(201).json(newAssignment);
    } catch (error) {
        await transaction.rollback();
        console.error('Error al asignar trabajo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const getWorksServicesId = async (req, res) => {
    try {
        const { id } = req.params;

        const works = await AsignacionTrabajo.findAll({
            where: { id_registro: id },
            include: [
                {
                    model: TipoMantenimiento,
                    attributes: ['id_tipo_trabajo', 'nombre_tipo']
                },
                {
                    model: RegistroServicioVehiculo,
                    attributes: ['id_registro', 'descripcion_problema'],
                    include: [
                        {
                            model: Vehiculo,
                            attributes: ['id_vehiculo', 'marca', 'modelo'],
                            include: [
                                {
                                    model: Usuario,
                                    attributes: ['id_usuario', 'nombre_usuario'],
                                    include: [
                                        {
                                            model: Persona,
                                            attributes: ['id_persona', 'nombre', 'apellido']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },{
                    //ocupo el usuario empleado me da el usuario administrador
                    model: Usuario,
                    as: 'empleadoAsignado',
                    attributes: ['id_usuario', 'nombre_usuario'],
                    include: [
                        {
                            model: Persona,
                            attributes: ['id_persona', 'nombre', 'apellido']
                        }
                    ]
                }
            ]
        });

        res.json(works);
    } catch (error) {
        console.error('Error al obtener trabajos asignados a empleado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const getWorksEmployees = async (req, res) => {
    try {
        const { id } = req.params;

        const works = await AsignacionTrabajo.findAll({
            where: { id_usuario_empleado: id },
            include: [
                {
                    model: TipoMantenimiento,
                    attributes: ['id_tipo_trabajo', 'nombre_tipo']
                },
                {
                    model: RegistroServicioVehiculo,
                    attributes: ['id_registro', 'descripcion_problema'],
                    include: [
                        {
                            model: Vehiculo,
                            attributes: ['id_vehiculo', 'marca', 'modelo'],
                            include: [
                                {
                                    model: Usuario,
                                    attributes: ['id_usuario', 'nombre_usuario'],
                                    include: [
                                        {
                                            model: Persona,
                                            attributes: ['id_persona', 'nombre', 'apellido']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        res.json(works);
    } catch (error) {
        console.error('Error al obtener trabajos asignados a empleado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const updateService = async (req, res) => {
    try {
        const { id_registro, descripcion_problema, estado, fecha_estimada_finalizacion, observaciones_iniciales, prioridad } = req.body;

        const service = await RegistroServicioVehiculo.findByPk(id_registro);
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        // Update service fields
        service.descripcion_problema = descripcion_problema;
        service.estado = estado;
        service.fecha_estimada_finalizacion = fecha_estimada_finalizacion;
        service.observaciones_iniciales = observaciones_iniciales;
        service.prioridad = prioridad;

        await service.save();
        res.json(service);
    } catch (error) {
        console.error('Error al actualizar el servicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getVehiclesWithClient,
    getTipoMantenimiento,
    addTipoMantenimiento,
    registerServiceVehicle,
    getServices,
    changeStateService,
    getAllEmployees,
    getAllSpecialists,
    assignWork,
    getWorksEmployees,
    updateService,
    getWorksServicesId
};
