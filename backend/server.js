
// const {dotenv} = require 'dotenv';
const { startServer } = require('./server/app');

const PORT = process.env.PORT || 3001;
startServer(PORT);
