const { getDBConnection, runMigrations } = require('./server/db');

module.exports = {
  getDBConnection,
  setupDatabase: runMigrations
};
