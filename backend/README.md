# Taller Mecánico - Backend

Este es el backend para el sistema de gestión de Taller Mecánico. Utiliza Node.js con Express, Sequelize ORM y MySQL.

## Requisitos previos

- Node.js (v14 o superior)
- MySQL Server
- npm o yarn

## Configuración inicial

### 1. Instalación de dependencias

```bash
npm install
```

### 2. Configuración de variables de entorno

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de base de datos:

```
DB_NAME=sistema_taller_mecanico
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_HOST=localhost
DB_DIALECT=mysql
NODE_ENV=development
DB_PORT=3306
```

### 3. Crear la base de datos

Antes de ejecutar las migraciones, asegúrate de crear la base de datos:

```sql
CREATE DATABASE IF NOT EXISTS sistema_taller_mecanico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Migraciones de base de datos

Las migraciones permiten versionar la estructura de la base de datos y facilitan la colaboración entre desarrolladores.

### Estructura del proyecto para migraciones

```
backend/
  ├── migrations/          # Archivos de migración
  ├── seeders/             # Datos de prueba
  ├── config/              # Configuraciones
  │   ├── database.js      # Configuración para migraciones
  │   └── sequelize.js     # Conexión para la aplicación
  └── .sequelizerc         # Configuración de rutas de Sequelize
```

### Comandos para migraciones

#### Ejecutar todas las migraciones pendientes

```bash
npm run migrate
```

#### Deshacer todas las migraciones

```bash
npm run migrate:undo
```

#### Crear una nueva migración

```bash
npm run create:migration nombre_de_tu_migracion
```

Esto creará un archivo en la carpeta `migrations` con la estructura básica:

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Código para realizar los cambios
  },

  async down(queryInterface, Sequelize) {
    // Código para revertir los cambios
  }
};
```

### Ejemplo de migración

Crear una tabla:

```javascript
async up(queryInterface, Sequelize) {
  await queryInterface.createTable('usuarios', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  });
}
```

Eliminar una tabla:

```javascript
async down(queryInterface, Sequelize) {
  await queryInterface.dropTable('usuarios');
}
```

## Datos de prueba (Seeders)

Los seeders permiten poblar la base de datos con información de prueba.

### Crear un nuevo seeder

```bash
npm run create:seed nombre_del_seeder
```

### Ejecutar todos los seeders

```bash
npm run db:seed
```

### Revertir todos los seeders

```bash
npm run db:seed:undo
```

## Ejecutar la aplicación

### Modo desarrollo (con reinicio automático)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

## Flujo de trabajo recomendado

1. Crear o modificar modelos en la carpeta `Model/`
2. Generar migraciones para reflejar los cambios:
   ```bash
   npm run create:migration add_columna_to_tabla
   ```
3. Editar el archivo de migración generado
4. Ejecutar la migración:
   ```bash
   npm run migrate
   ```
5. Si necesitas datos de prueba, crea y ejecuta seeders

## Solución de problemas comunes

### Error: Access denied for user

Asegúrate de que las credenciales en tu archivo `.env` sean correctas y que el usuario tenga permisos suficientes.

### Error de conexión a la base de datos

Verifica que el servidor MySQL esté en ejecución y que la configuración de host y puerto sea correcta.

### Las migraciones no se ejecutan

1. Verifica que la estructura de `.sequelizerc` sea correcta
2. Asegúrate de que los archivos de configuración (`config/database.js`) estén correctamente formateados

## Estructura de la base de datos

El sistema utiliza las siguientes tablas principales:

- `persona`: Almacena la información personal
- `contacto_persona`: Almacena información de contacto
- `rol`: Define los roles del sistema
- `usuario`: Gestiona las credenciales y accesos

## Contribuir al proyecto

1. Crea una rama para tu característica: `git checkout -b feature/nueva-caracteristica`
2. Realiza tus cambios y haz commit: `git commit -m 'Agrega nueva característica'`
3. Empuja tus cambios: `git push origin feature/nueva-caracteristica`
4. Envía un pull request
