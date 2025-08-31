import axios from 'axios';

// Create axios instance for client API calls
const clientApi = axios.create({
  baseURL: '/api/clientes',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
clientApi.interceptors.request.use(
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
clientApi.interceptors.response.use(
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

// Client service functions
const clientService = {
  // Vehicles
  getMyVehicles: async (id) => {
    try {
      const response = await clientApi.get(`/mis_vehiculos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },
  
  // Services
  getAllServices: async (id) => {
    try {
      const response = await clientApi.get(`/mis_servicios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },
  
  authorizeService: async (id) => {
    try {
      const response = await clientApi.put(`/autorizar_servicio/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error authorizing service:', error);
      throw error;
    }
  },
  
  notAuthorizeService: async (id) => {
    try {
      const response = await clientApi.put(`/no_autorizar_servicio/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting service:', error);
      throw error;
    }
  },
  
  getServicesDetailByVehicle: async (id) => {
    try {
      const response = await clientApi.get(`/detalle_servicios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service details:', error);
      throw error;
    }
  },
  
  // Comments
  getServicesWithComments: async (id) => {
    try {
      const response = await clientApi.get(`/servicios_con_comentarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services with comments:', error);
      throw error;
    }
  },
  
  addFollowComment: async (data) => {
    try {
      const response = await clientApi.post('/comentarios_seguimiento', data);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  // Additional Services
  getAdditionalServices: async (id) => {
    try {
      const response = await clientApi.get(`/servicios_adicionales/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching additional services:', error);
      throw error;
    }
  },
  
  addAdditionalService: async (data) => {
    try {
      const response = await clientApi.post('/servicios_adicionales', data);
      return response.data;
    } catch (error) {
      console.error('Error adding additional service:', error);
      throw error;
    }
  },
  
  getMaintenanceTypes: async () => {
    try {
      const response = await clientApi.get('/tipos_mantenimiento');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
      throw error;
    }
  },
  
  // Quotes
  getQuotes: async (id) => {
    try {
      const response = await clientApi.get(`/cotizaciones_servicios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  },
  
  requestQuote: async (data) => {
    try {
      const response = await clientApi.post('/solicitar_cotizacion', data);
      return response.data;
    } catch (error) {
      console.error('Error requesting quote:', error);
      throw error;
    }
  },
  
  // Invoices
  getInvoices: async (id) => {
    try {
      const response = await clientApi.get(`/facturas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  payInvoice: async (data) => {
    try {
      const response = await clientApi.post('/pagar_factura', data);
      return response.data;
    } catch (error) {
      console.error('Error paying invoice:', error);
      throw error;
    }
  },
  
  // Ratings
  rateService: async (data) => {
    try {
      const response = await clientApi.post('/calificar_servicio', data);
      return response.data;
    } catch (error) {
      console.error('Error rating service:', error);
      throw error;
    }
  }
};

export { clientService };
