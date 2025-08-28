import axios from 'axios';

// Create axios instance for specialist API calls
const specialistApi = axios.create({
  baseURL: '/api/especialistas',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Update token retrieval to match the new authentication flow
specialistApi.interceptors.request.use(
  (config) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('Error accessing user token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error interceptor with updated approach
specialistApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't handle errors during logout operations
    const isLogoutRequest = error.config?.url?.includes('logout');
    if (isLogoutRequest) {
      return Promise.reject(error);
    }
    
    if (error.response) {
      if (error.response.status === 401) {
        alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        alert('No tiene permisos para realizar esta acción.');
      } else if (error.response.status === 500) {
        alert('Error en el servidor. Por favor intente más tarde.');
      }
    } else if (error.request) {
      alert('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    } else {
      alert('Error en la solicitud. Por favor intente nuevamente.');
    }
    
    return Promise.reject(error);
  }
);

// Specialist service functions
const serviceSpecialistService = {
  // Assigned works
  getWorksAssigned: async (id) => {
    try {
      const response = await specialistApi.get(`/trabajos_asignados/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned works:', error);
      throw error;
    }
  },

  // Update work assignment
  updateWorkAssignment: async (id, data) => {
    try {
      const response = await specialistApi.put(`/actualizar_trabajo/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating work assignment:', error);
      throw error;
    }
  },

  // Get vehicle history
  getVehicleHistory: async (id) => {
    try {
      const response = await specialistApi.get(`/historial_vehiculo/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      throw error;
    }
  },

  // Diagnostic management
  addDiagnostic: async (data) => {
    try {
      const response = await specialistApi.post('/agregar_diagnostico', data);
      return response.data;
    } catch (error) {
      console.error('Error adding diagnostic:', error);
      throw error;
    }
  },

  addDiagnosticDetail: async (id, data) => {
    try {
      const response = await specialistApi.post(`/agregar_detalle_diagnostico/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding diagnostic detail:', error);
      throw error;
    }
  },

  getDiagnosticsBySpecialist: async (id) => {
    try {
      const response = await specialistApi.get(`/diagnosticos_especialista/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching specialist diagnostics:', error);
      throw error;
    }
  },

  // Technical test management
  addTechnicalTest: async (data) => {
    try {
      const response = await specialistApi.post('/agregar_prueba_tecnica', data);
      return response.data;
    } catch (error) {
      console.error('Error adding technical test:', error);
      throw error;
    }
  },

  addTestResult: async (id, data) => {
    try {
      const response = await specialistApi.post(`/agregar_resultado_prueba/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding test result:', error);
      throw error;
    }
  },

  getTechnicalTestsBySpecialist: async (id) => {
    try {
      const response = await specialistApi.get(`/pruebas_tecnicas_especialista/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching specialist technical tests:', error);
      throw error;
    }
  },

  // Solution proposals
  addSolutionProposal: async (data) => {
    try {
      const response = await specialistApi.post('/agregar_propuesta_solucion', data);
      return response.data;
    } catch (error) {
      console.error('Error adding solution proposal:', error);
      throw error;
    }
  },

  getSolutionsByTestResult: async (id) => {
    try {
      const response = await specialistApi.get(`/soluciones_prueba/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching solutions by test result:', error);
      throw error;
    }
  },

  // Comments and recommendations
  addCommentsVehicleSpecialist: async (data) => {
    try {
      const response = await specialistApi.post('/agregar_comentarios_vehiculo', data);
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle comment:', error);
      throw error;
    }
  },

  getCommentsByAssignment: async (id) => {
    try {
      const response = await specialistApi.get(`/comentarios_asignacion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments by assignment:', error);
      throw error;
    }
  },

  addVehicleRecommendation: async (data) => {
    try {
      const response = await specialistApi.post('/agregar_recomendacion_vehiculo', data);
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle recommendation:', error);
      throw error;
    }
  },

  getRecommendationsByAssignment: async (id) => {
    try {
      const response = await specialistApi.get(`/recomendaciones_asignacion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations by assignment:', error);
      throw error;
    }
  },

  // Support requests
  createSupportRequest: async (data) => {
    try {
      const response = await specialistApi.post('/crear_solicitud_apoyo', data);
      return response.data;
    } catch (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
  },

  getSupportRequestsBySpecialist: async (id) => {
    try {
      const response = await specialistApi.get(`/solicitudes_apoyo_especialista/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching support requests by specialist:', error);
      throw error;
    }
  },

  respondToSupportRequest: async (data) => {
    try {
      const response = await specialistApi.post('/responder_solicitud_apoyo', data);
      return response.data;
    } catch (error) {
      console.error('Error responding to support request:', error);
      throw error;
    }
  },

  // Replacement parts
  getReplacementPartRequests: async () => {
    try {
      const response = await specialistApi.get('/solicitudes_repuestos');
      return response.data;
    } catch (error) {
      console.error('Error fetching replacement part requests:', error);
      throw error;
    }
  },

  acceptReplacementPart: async (data) => {
    try {
      const response = await specialistApi.post('/aceptar_repuesto', data);
      return response.data;
    } catch (error) {
      console.error('Error accepting replacement part:', error);
      throw error;
    }
  },

  // Get specialists
  getSpecialists: async () => {
    try {
      const response = await specialistApi.get('/usuarios_especialistas');
      return response.data;
    } catch (error) {
      console.error('Error fetching specialists:', error);
      throw error;
    }
  }
};

export { serviceSpecialistService };
