import axios from 'axios';

// Create axios instance for invoice API calls
const invoiceApi = axios.create({
  baseURL: '/api/facturas',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
invoiceApi.interceptors.request.use(
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

// Error handling interceptor
invoiceApi.interceptors.response.use(
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

// Invoice service functions
const invoiceService = {
  // Get list of invoices
  getInvoices: async () => {
    try {
      const response = await invoiceApi.get('/listar');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Generate new invoice for a completed service
  generateInvoice: async (invoiceData) => {
    try {
      const response = await invoiceApi.post('/generar', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  },

  // Get invoice payment history
  getInvoicePayments: async (invoiceId) => {
    try {
      const response = await invoiceApi.get(`/listar-pagos/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice payments:', error);
      throw error;
    }
  },

  // Get invoice balance
  getInvoiceBalance: async (invoiceId) => {
    try {
      const response = await invoiceApi.get(`/consultar-saldo/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice balance:', error);
      throw error;
    }
  },

  // Get completed services that can be invoiced
  getCompletedServices: async () => {
    try {
      const response = await invoiceApi.get('/obtener-servicios-completados');
      return response.data;
    } catch (error) {
      console.error('Error fetching completed services:', error);
      throw error;
    }
  }
};

export { invoiceService };
