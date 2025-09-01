import axios from 'axios';

// Create axios instance for report API calls
const reportApi = axios.create({
  baseURL: '/api/reportes',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
reportApi.interceptors.request.use(
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

// Error interceptor
reportApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Report service functions
const reportService = {
  // Operational reports
  getWorksByPeriod: async (startDate, endDate, status) => {
    try {
      const params = { startDate, endDate };
      if (status) params.status = status;
      const response = await reportApi.get('/trabajos_por_periodo', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching works by period:', error);
      throw error;
    }
  },

  getMaintenanceHistoryByVehicle: async (vehicleId) => {
    try {
      const response = await reportApi.get(`/historial_mantenimiento/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      throw error;
    }
  },

  getCompletedWorks: async (startDate, endDate, mechanicId) => {
    try {
      const params = { startDate, endDate };
      if (mechanicId) params.mechanicId = mechanicId;
      const response = await reportApi.get('/trabajos_completados', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching completed works:', error);
      throw error;
    }
  },

  getVehicles: async () => {
    try {
      const response = await reportApi.get('/vehiculos');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  getMechanics: async () => {
    try {
      const response = await reportApi.get('/mecanicos');
      return response.data;
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      throw error;
    }
  },

  // Financial reports
  getIncomeExpensesByPeriod: async (startDate, endDate) => {
    try {
      const response = await reportApi.get('/ingresos_gastos', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching income/expenses:', error);
      throw error;
    }
  },

  getProviderExpenses: async (startDate, endDate, providerId) => {
    try {
      const params = { startDate, endDate };
      if (providerId) params.providerId = providerId;
      const response = await reportApi.get('/gastos_proveedor', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching provider expenses:', error);
      throw error;
    }
  },

  getProviders: async () => {
    try {
      const response = await reportApi.get('/proveedores');
      return response.data;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  },

  // Inventory reports
  getPartUsageByPeriod: async (startDate, endDate) => {
    try {
      const response = await reportApi.get('/partes_usadas', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching part usage:', error);
      throw error;
    }
  },

  getMostUsedPartsByVehicleType: async (brand, model, startDate, endDate) => {
    try {
      const params = {};
      if (brand) params.brand = brand;
      if (model) params.model = model;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await reportApi.get('/partes_mas_usadas', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching most used parts:', error);
      throw error;
    }
  },

  // Customer reports
  getClients: async () => {
    try {
      const response = await reportApi.get('/clientes');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },
  
  getServiceHistoryByClient: async (clientId) => {
    try {
      const response = await reportApi.get(`/cliente_historial/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client service history:', error);
      throw error;
    }
  },

  getServiceRatings: async (startDate, endDate, minRating, maxRating) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      
      const response = await reportApi.get('/cliente_calificaciones', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching service ratings:', error);
      throw error;
    }
  }
};

export { reportService };
