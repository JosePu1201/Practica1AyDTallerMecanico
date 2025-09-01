import axios from 'axios';

// Create axios instance for request client admin API calls
const requestClientAdminApi = axios.create({
  baseURL: '/api/solicitudes',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
requestClientAdminApi.interceptors.request.use(
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

// Add response interceptor to handle errors
requestClientAdminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        alert('No tiene permisos para realizar esta acción.');
      }
    } else if (error.request) {
      console.error('No se pudo conectar con el servidor:', error.request);
    } else {
      console.error('Error en la solicitud:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Request client admin service functions
const requestClientAdminService = {
  // Get all additional services
  getAdditionalServices: async () => {
    try {
      const response = await requestClientAdminApi.get('/servicios_adicionales');
      return response.data;
    } catch (error) {
      console.error('Error fetching additional services:', error);
      throw error;
    }
  },

  // Get maintenance types
  getMaintenanceTypes: async () => {
    try {
      const response = await requestClientAdminApi.get('/tipo_mantenimiento');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
      throw error;
    }
  },

  // Accept additional service
  acceptAdditionalService: async (data) => {
    try {
      const response = await requestClientAdminApi.post('/aceptar_servicio_adicional', data);
      return response.data;
    } catch (error) {
      console.error('Error accepting additional service:', error);
      throw error;
    }
  },

  // Decline additional service
  declineAdditionalService: async (id) => {
    try {
      const response = await requestClientAdminApi.post(`/rechazar_servicio_adicional/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error declining additional service:', error);
      throw error;
    }
  },

  // Get price service quotes
  getPriceServiceQuotes: async (clientId) => {
    try {
      const response = await requestClientAdminApi.get(`/cotizaciones_servicios_precio/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching price service quotes:', error);
      throw error;
    }
  },

  // Add work to quote
  addWorkToQuote: async (data) => {
    try {
      const response = await requestClientAdminApi.post('/agregar_trabajo_cotizacion', data);
      return response.data;
    } catch (error) {
      console.error('Error adding work to quote:', error);
      throw error;
    }
  },

  // Send quote
  sendQuote: async (id) => {
    try {
      const response = await requestClientAdminApi.post(`/enviar_cotizacion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error sending quote:', error);
      throw error;
    }
  },
  
  // Get quote details
  getQuoteDetails: async (id) => {
    try {
      const response = await requestClientAdminApi.get(`/detalles_cotizacion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quote details:', error);
      throw error;
    }
  },
  
  // Update quote
  updateQuote: async (id, data) => {
    try {
      const response = await requestClientAdminApi.put(`/actualizar_cotizacion/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },
  
  // Get service additional details
  getAdditionalServiceDetails: async (id) => {
    try {
      const response = await requestClientAdminApi.get(`/detalle_servicio_adicional/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching additional service details:', error);
      throw error;
    }
  },
  
  // Get requests summary statistics
  getRequestsStatistics: async () => {
    try {
      const response = await requestClientAdminApi.get('/estadisticas_solicitudes');
      return response.data;
    } catch (error) {
      console.error('Error fetching requests statistics:', error);
      throw error;
    }
  }
};

export { requestClientAdminService };
