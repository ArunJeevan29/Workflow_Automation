// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');

const workflowRoutes = require('./src/routes/workflowRoutes');

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Halleyx Workflow Engine API is running' });
});

app.use('/api/workflows', workflowRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});