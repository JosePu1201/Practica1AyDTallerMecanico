import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userService } from '../../services/adminService';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id_usuario', direction: 'asc' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los usuarios: ' + (err.response?.data?.error || err.message));
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await userService.deleteUser(id);
        toast.success('Usuario eliminado con éxito');
        fetchUsers();
      } catch (err) {
        toast.error('Error al eliminar el usuario: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        let aVal, bVal;
        
        // Handle nested properties
        if (sortConfig.key === 'nombre') {
          aVal = a.persona?.nombre || '';
          bVal = b.persona?.nombre || '';
        } else if (sortConfig.key === 'apellido') {
          aVal = a.persona?.apellido || '';
          bVal = b.persona?.apellido || '';
        } else if (sortConfig.key === 'rol') {
          aVal = a.rol?.nombre_rol || '';
          bVal = b.rol?.nombre_rol || '';
        } else {
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
        }
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return sortedUsers;
    
    return sortedUsers.filter(user => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        user.nombre_usuario?.toLowerCase().includes(searchTermLower) ||
        user.persona?.nombre?.toLowerCase().includes(searchTermLower) ||
        user.persona?.apellido?.toLowerCase().includes(searchTermLower) ||
        user.rol?.nombre_rol?.toLowerCase().includes(searchTermLower)
      );
    });
  }, [sortedUsers, searchTerm]);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
    return sortConfig.direction === 'asc' 
      ? <i className="bi bi-sort-down ms-1"></i> 
      : <i className="bi bi-sort-up ms-1"></i>;
  };

  const getUserStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVO':
        return <Badge bg="success">Activo</Badge>;
      case 'INACTIVO':
        return <Badge bg="secondary">Inactivo</Badge>;
      case 'BLOQUEADO':
        return <Badge bg="danger">Bloqueado</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Usuarios</h1>
        <Link to="/admin/usuarios/nuevo" className="btn btn-primary">
          <i className="bi bi-plus-circle me-1"></i> Nuevo Usuario
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <InputGroup className="mb-3">
            <InputGroup.Text id="search-addon">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar usuarios..."
              aria-label="Buscar"
              aria-describedby="search-addon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            )}
          </InputGroup>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th onClick={() => handleSort('id_usuario')} style={{ cursor: 'pointer' }}>
                    ID {renderSortIcon('id_usuario')}
                  </th>
                  <th onClick={() => handleSort('nombre_usuario')} style={{ cursor: 'pointer' }}>
                    Usuario {renderSortIcon('nombre_usuario')}
                  </th>
                  <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>
                    Nombre {renderSortIcon('nombre')}
                  </th>
                  <th onClick={() => handleSort('apellido')} style={{ cursor: 'pointer' }}>
                    Apellido {renderSortIcon('apellido')}
                  </th>
                  <th onClick={() => handleSort('rol')} style={{ cursor: 'pointer' }}>
                    Rol {renderSortIcon('rol')}
                  </th>
                  <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>
                    Estado {renderSortIcon('estado')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No hay usuarios disponibles</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id_usuario}>
                      <td>{user.id_usuario}</td>
                      <td>{user.nombre_usuario}</td>
                      <td>{user.Persona?.nombre}</td>
                      <td>{user.Persona?.apellido}</td>
                      <td>{user.Rol?.nombre_rol}</td>
                      <td>{getUserStatusBadge(user.estado)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link 
                            to={`/admin/usuarios/editar/${user.id_usuario}`}
                            className="btn btn-outline-primary"
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <Link 
                            to={`/admin/usuarios/detalle/${user.id_usuario}`}
                            className="btn btn-outline-info"
                            title="Ver detalles"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Button 
                            variant="outline-danger"
                            onClick={() => handleDelete(user.id_usuario)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="text-muted">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </div>
        </div>
      </div>
    </div>
  );
}
