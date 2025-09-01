import axios from 'axios';
import { notifyError } from '../utils/notifications';

// Create axios instance for service API calls
const serviceApi = axios.create({
  baseURL: '/api/servicios',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
serviceApi.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
serviceApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 401) {
        notifyError('Sesión expirada. Por favor inicie sesión nuevamente.');
        // Redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        notifyError('No tiene permisos para realizar esta acción');
      } else if (error.response.status === 500) {
        notifyError('Error en el servidor. Por favor intente más tarde');
      }
    } else if (error.request) {
      notifyError('No se pudo conectar con el servidor');
    } else {
      notifyError('Error en la solicitud');
    }
    
    return Promise.reject(error);
  }
);

// Service management services
const serviceManagementService = {
  // Get vehicles with client information
  getVehiclesWithClient: async () => {
    try {
      const response = await serviceApi.get('/vehicles_with_client');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles with client:', error);
      throw error;
    }
  },

  // Get maintenance types
  getMaintenanceTypes: async () => {
    try {
      const response = await serviceApi.get('/tipo_mantenimiento');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
      throw error;
    }
  },

  // Add new maintenance type
  addMaintenanceType: async (data) => {
    try {
      const response = await serviceApi.post('/tipo_mantenimiento', data);
      return response.data;
    } catch (error) {
      console.error('Error adding maintenance type:', error);
      throw error;
    }
  },

  // Register a new vehicle service
  registerServiceVehicle: async (data) => {
    try {
      const response = await serviceApi.post('/registro_servicio_vehiculo', data);
      return response.data;
    } catch (error) {
      console.error('Error registering vehicle service:', error);
      throw error;
    }
  },

  // Get all services
  getServices: async () => {
    try {
      const response = await serviceApi.get('/obtener_servicios');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Update service status
  updateServiceStatus: async (id, status) => {
    try {
      const response = await serviceApi.put('/cambiar_estado_servicio', { id_registro: id, estado: status });
      return response.data;
    } catch (error) {
      console.error('Error updating service status:', error);
      throw error;
    }
  },

  // Update service
  updateService: async (data) => {
    try {
      const response = await serviceApi.put('/actualizar_servicio', data);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Get all employees
  getEmployees: async () => {
    try {
      const response = await serviceApi.get('/empleados');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get all specialists
  getSpecialists: async () => {
    try {
      const response = await serviceApi.get('/especialistas');
      return response.data;
    } catch (error) {
      console.error('Error fetching specialists:', error);
      throw error;
    }
  },

  // Assign work
  assignWork: async (data) => {
    try {
      const response = await serviceApi.post('/asignar_trabajo', data);
      return response.data;
    } catch (error) {
      console.error('Error assigning work:', error);
      throw error;
    }
  },

  // Get works for employee
  getWorksEmployee: async (id) => {
    try {
      const response = await serviceApi.get(`/trabajos_empleados/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching works for employee ${id}:`, error);
      throw error;
    }
  },

  // Get works by service ID
  getWorksByServiceId: async (id) => {
    try {
      const response = await serviceApi.get(`/trabajos_servicio/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching works for service ${id}:`, error);
      throw error;
    }
  },

  // Change employee work
  changeEmployeeWork: async (data) => {
    try {
      const response = await serviceApi.put('/cambiar_empleado_trabajo', data);
      return response.data;
    } catch (error) {
      console.error('Error changing employee:', error);
      throw error;
    }
  },
};

export { serviceManagementService };
