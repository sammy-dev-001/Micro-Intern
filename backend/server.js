/**
 * MicroIntern Backend Entrypoint (v2.1)
 * Restructured from prototype-v1 into modular architecture.
 */

const { startServer } = require('./server/app');

const PORT = process.env.PORT || 3001;
startServer(PORT);
