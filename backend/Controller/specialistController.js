const {Rol, TipoMantenimiento, Vehiculo, AsignacionTrabajo, RegistroServicioVehiculo} = require('../Model');
const {Usuario, UsuarioEspecialista, TipoTecnico, AreaEspecialista, Persona, sequelize} = require('../Model');
const {DiagnosticoEspecialista, DetalleDiagnostico, PruebaTecnicaEspecialista, ResultadoPruebaTecnica} = require('../Model');    
const {SolucionPropuesta, ComentariosVehiculoEspecialista, RecomendacionesVehiculo} = require('../Model');
const {AvancesTrabajo , ObservacionesProcesoTrabajo,ImprevistosTrabajo} = require('../Model')
const{DaniosAdicionales,SolicitudUsoRepuesto, SolicitudApoyo, Inventario} = require('../Model');


const getWorksAssigned = async (req, res) => {
    try {
        const { id } = req.params;
        const works = await AsignacionTrabajo.findAll({
            where: { id_usuario_empleado: id },
            include: [
                {
                    model: TipoMantenimiento,
                    attributes: ['nombre_tipo', 'descripcion']
                },
                {
                    model: RegistroServicioVehiculo,
                    include: [
                        {
                            model: Vehiculo,
                            attributes: ['marca', 'modelo', 'anio', 'placa']
                        }
                    ],
                    attributes: ['id_registro', 'fecha_ingreso', 'descripcion_problema', 'observaciones_iniciales']
                }
            ]
        });


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateWorkAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones_finalizacion } = req.body;
        const fecha_finalizacion = new Date();
        if (estado === 'COMPLETADO') {
            const updated = await AsignacionTrabajo.update(
                { fecha_finalizacion },
                { where: { id_asignacion: id } }
            );
        }
        const updated = await AsignacionTrabajo.update(
            { estado, observaciones_finalizacion },
            { where: { id_asignacion: id } }
        );

        if (updated) {
            const updatedWork = await AsignacionTrabajo.findOne({ where: { id_asignacion: id } });
            return res.status(200).json(updatedWork);
        }
        throw new Error('Work assignment not found');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHistoryVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const history = await RegistroServicioVehiculo.findAll({
            where: { id_vehiculo: id },
            include: [
                {
                    model: AsignacionTrabajo,
                    include: [
                        {
                            model: DaniosAdicionales,
                            attributes: ['id_danio', 'descripcion_danio', 'fecha_danio', 'costo_estimado', 'requiere_autorizacion', 'autorizado']
                        },
                        {
                            model: SolicitudUsoRepuesto,
                            attributes: ['id_solicitud_uso_repuesto', 'fecha_uso', 'descripcion', 'cantidad', 'estado', 'id_usuario_aceptacion', 'id_inventario_repuesto', 'fecha_aprobacion']
                        }
                    ],
                    attributes: ['id_asignacion', 'estado', 'descripcion', 'fecha_asignacion', 'fecha_inicio_real', 'fecha_finalizacion', 'precio', 'observaciones_finalizacion']
                }
            ],
            order: [['fecha_ingreso', 'DESC']]
        });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addDiagnostic = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_asignacion_trabajo, id_usuario_especialista, observaciones_generales } = req.body;

        const newDiagnostic = await DiagnosticoEspecialista.create({
            id_asignacion_trabajo,
            id_usuario_especialista,
            observaciones_generales
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Diagnostic and details added successfully', diagnostic: newDiagnostic });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const addDiagnosticDetail = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id } = req.params;
        const { tipo_diagnostico, descripcion, severidad } = req.body;

        const diagnostic = await DiagnosticoEspecialista.findByPk(id);
        if (!diagnostic) {
            return res.status(404).json({ error: 'Diagnostic not found' });
        }

        const newDetail = await DetalleDiagnostico.create({
            id_diagnostico_especialista: id,
            tipo_diagnostico,
            descripcion,
            severidad
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Diagnostic detail added successfully', detail: newDetail });
    } catch (error) {
        await transaction.rollback();   
        res.status(500).json({ error: error.message });
    }
};

const getDiagnosticsBySpecialist = async (req, res) => {
    try {
        const { id } = req.params;
        const diagnostics = await DiagnosticoEspecialista.findAll({
            where: { id_usuario_especialista: id },
            include: [
                {
                    model: DetalleDiagnostico,
                    attributes: ['id_detalle_diagnostico', 'tipo_diagnostico', 'descripcion', 'severidad']
                },
                {
                    model: AsignacionTrabajo,
                    attributes: ['id_asignacion', 'estado', 'descripcion', 'fecha_asignacion', 'fecha_inicio_real', 'fecha_finalizacion', 'precio', 'observaciones_finalizacion'],
                    include: [
                        {
                            model: RegistroServicioVehiculo,
                            attributes: ['id_registro', 'fecha_ingreso', 'descripcion_problema', 'observaciones_iniciales'],
                            include: [
                                {
                                    model: Vehiculo,
                                    attributes: ['marca', 'modelo', 'anio', 'placa']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['fecha_diagnostico', 'DESC']]
        });

        res.status(200).json(diagnostics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addTechnicalTest = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_especialista, id_asignacion_trabajo, descripcion_prueba_tecnica } = req.body;

        const newTest = await PruebaTecnicaEspecialista.create({
            id_especialista,
            id_asignacion_trabajo,
            descripcion_prueba_tecnica
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Technical test added successfully', test: newTest });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const addTestResult = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_prueba_tecnica, descripcion_resultado, resultado_satisfactorio } = req.body;

        const newResult = await ResultadoPruebaTecnica.create({
            id_prueba_tecnica,
            descripcion_resultado,
            resultado_satisfactorio
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Test result added successfully', result: newResult });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const getTechnicalTestsBySpecialist = async (req, res) => {
    try {
        const { id } = req.params;
        const tests = await PruebaTecnicaEspecialista.findAll({
            where: { id_especialista: id },
            include: [
                {
                    model: AsignacionTrabajo,
                    attributes: ['id_asignacion', 'estado', 'descripcion', 'fecha_asignacion', 'fecha_inicio_real', 'fecha_finalizacion', 'precio', 'observaciones_finalizacion'],
                    include: [
                        {
                            model: RegistroServicioVehiculo,
                            attributes: ['id_registro', 'fecha_ingreso', 'descripcion_problema', 'observaciones_iniciales'],
                            include: [
                                {
                                    model: Vehiculo,
                                    attributes: ['marca', 'modelo', 'anio', 'placa']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['fecha_prueba', 'DESC']]
        });

        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addSolutionProposal = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_resultado_prueba, descripcion_solucion, costo_estimado, tiempo_estimado, prioridad } = req.body;

        const newSolution = await SolucionPropuesta.create({
            id_resultado_prueba,
            descripcion_solucion,
            costo_estimado,
            tiempo_estimado,
            prioridad
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Solution proposal added successfully', solution: newSolution });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const getSolutionsByTestResult = async (req, res) => {
    try {
        const { id } = req.params;
        const solutions = await SolucionPropuesta.findAll({
            where: { id_resultado_prueba: id },
            order: [['fecha_propuesta', 'DESC']]
        });

        res.status(200).json(solutions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addCommentsVehicleSpecialist = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_asignacion_trabajo, id_especialista, comentario, tipo_comentario } = req.body;

        const newComment = await ComentariosVehiculoEspecialista.create({
            id_asignacion_trabajo,
            id_especialista,
            comentario,
            tipo_comentario
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const getCommentsByAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await ComentariosVehiculoEspecialista.findAll({
            where: { id_asignacion_trabajo: id },
            order: [['fecha_comentario', 'DESC']]
        });

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addVehicleRecommendation = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_asignacion_trabajo, id_especialista, recomendacion, prioridad, tipo_recomendacion } = req.body;

        const newRecommendation = await RecomendacionesVehiculo.create({
            id_asignacion_trabajo,
            id_especialista,
            recomendacion,
            prioridad,
            tipo_recomendacion
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Vehicle recommendation added successfully', recommendation: newRecommendation });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const getRecommendationsByAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const recommendations = await RecomendacionesVehiculo.findAll({
            where: { id_asignacion_trabajo: id },
            order: [['fecha_recomendacion', 'DESC']]
        });

        res.status(200).json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createRequestSupport = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_asignacion_trabajo, id_usuario_especialista, descripcion_apoyo } = req.body;

        const newSupportRequest = await SolicitudApoyo.create({
            id_asignacion_trabajo,
            id_usuario_especialista,
            descripcion_apoyo
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Support request created successfully', supportRequest: newSupportRequest });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const getRequestsSupportBySpecialist = async (req, res) => {
    try {
        const { id } = req.params;
        const supportRequests = await SolicitudApoyo.findAll({
            where: { id_usuario_especialista: id },
            order: [['fecha_apoyo', 'DESC']]
        });

        res.status(200).json(supportRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const respondToSupportRequest = async (req, res) => {
    try {
        const { id, estado, observaciones_respuesta } = req.body;

        const supportRequest = await SolicitudApoyo.findByPk(id);
        if (!supportRequest) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        supportRequest.estado = estado;
        supportRequest.observaciones_respuesta = observaciones_respuesta;
        await supportRequest.save();

        res.status(200).json({ message: 'Support request updated successfully', supportRequest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getRequestsReplacementPartsByAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const partRequests = await SolicitudUsoRepuesto.findAll({
            where: { id_asignacion_trabajo: id },
            order: [['fecha_uso', 'DESC']]
        });

        res.status(200).json(partRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const aceptReplacementPart = async (req, res) => {
    try {
        const transaction = await sequelize.transaction();
        const { id_solicitud_uso_repuesto, id_usuario_aceptacion, id_inventario_repuesto } = req.body;

        const inventoryItem = await Inventario.findByPk(id_inventario_repuesto);
       if (!inventoryItem) {
           return res.status(404).json({ message: 'Inventory item not found' });
       }

       const partRequest = await SolicitudUsoRepuesto.findByPk(id_solicitud_uso_repuesto);
       if (!partRequest) {
           return res.status(404).json({ message: 'Part request not found' });
       }

       //existencias
       if (inventoryItem.cantidad < partRequest.cantidad) {
           return res.status(400).json({ message: 'Insufficient inventory' });
       }

       const updatePartRequest = await SolicitudUsoRepuesto.update({
           estado: 'APROBADO',
           id_usuario_aceptacion,
           fecha_aprobacion: new Date()
       }, {
           where: { id_solicitud_uso_repuesto }
       }, { sequelize });

       await Inventario.update({
           cantidad: inventoryItem.cantidad - partRequest.cantidad
       }, {
           where: { id_inventario_repuesto }
       }, { sequelize });

       await transaction.commit();
       res.status(200).json({ message: 'Part request updated successfully', partRequest });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getWorksAssigned,
    updateWorkAssignment,
    getHistoryVehicle,
    addDiagnostic,
    addDiagnosticDetail,
    getDiagnosticsBySpecialist,
    addTechnicalTest,
    addTestResult,
    getTechnicalTestsBySpecialist,
    addSolutionProposal,
    getSolutionsByTestResult,
    addCommentsVehicleSpecialist,
    getCommentsByAssignment,
    addVehicleRecommendation,
    getRecommendationsByAssignment,
    createRequestSupport,
    getRequestsSupportBySpecialist,
    respondToSupportRequest,
    getRequestsReplacementPartsByAssignment,
    aceptReplacementPart
};