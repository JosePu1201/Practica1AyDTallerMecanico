import axios from 'axios';
import { notifyError } from '../utils/notifications';

// Create axios instance for admin API calls
const adminApi = axios.create({
  baseURL: '/api/management',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
adminApi.interceptors.request.use(
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
adminApi.interceptors.response.use(
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

// User management services
const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await adminApi.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await adminApi.get(`/users/user/${id}`);
        console.log(`Fetched user ${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await adminApi.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await adminApi.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await adminApi.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await adminApi.get('/users/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get all specialists
  getAllSpecialists: async () => {
    try {
      const response = await adminApi.get('/users/specialists');
      return response.data;
    } catch (error) {
      console.error('Error fetching specialists:', error);
      throw error;
    }
  },

  // Get all specialist areas
  getAllSpecialistAreas: async () => {
    try {
      const response = await adminApi.get('/users/areas');
      return response.data;
    } catch (error) {
      console.error('Error fetching specialist areas:', error);
      throw error;
    }
  },

  // Get all technician types
  getAllTechnicianTypes: async () => {
    try {
      const response = await adminApi.get('/users/tipos');
      return response.data;
    } catch (error) {
      console.error('Error fetching technician types:', error);
      throw error;
    }
  },

  // Assign specialization to user
  assignSpecialization: async (data) => {
    try {
      const response = await adminApi.post('/users/asignar-especializacion', data);
      return response.data;
    } catch (error) {
      console.error('Error assigning specialization:', error);
      throw error;
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await adminApi.post('/users/roles', roleData);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }
};

export { userService };
