const { Sequelize } = require('sequelize');
const path = require('path');

// Get environment-specific config
let config;

// Check if we're in test environment
if (process.env.NODE_ENV === 'test') {
  // Use SQLite for testing
  config = {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  };
} else {
  // Use regular database configuration for development/production
  config = {
    username: process.env.DB_USER || 'root',  // Provide default value
    password: process.env.DB_PASS || '',      // Empty string is default MySQL password
    database: process.env.DB_NAME || 'sistema_taller_mecanico', // Default database name
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    dialect:  process.env.DB_DIALECT || 'mysql',
    logging:  process.env.DB_LOGGING === 'true',
    dialectOptions: {
      charset: 'utf8mb4',
    }
  };
}

// Create Sequelize instance based on environment
let sequelize;

if (process.env.NODE_ENV === 'test') {
  // For test environment, use the config object directly
  sequelize = new Sequelize({
    dialect: config.dialect,
    storage: config.storage,
    logging: config.logging
  });
} else {
  // For development/production, use the regular configuration
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      dialectOptions: config.dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;