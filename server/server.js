require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');

const workflowRoutes = require('./src/routes/workflowRoutes');
const stepRoutes = require('./src/routes/stepRoutes');
const ruleRoutes = require('./src/routes/ruleRoutes');
const executionRoutes = require('./src/routes/executionRoutes');

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Halleyx Workflow Engine API is running' });
});

app.use('/api/workflows/:workflow_id/steps', stepRoutes);
app.use('/api/workflows/:workflow_id/execute', executionRoutes);
app.use('/api/steps/:step_id/rules', ruleRoutes);

app.use('/api/workflows', workflowRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/executions', executionRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});