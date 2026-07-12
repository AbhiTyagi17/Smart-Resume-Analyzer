require('dotenv').config();
const express = require('express');
const cors = require('cors');
const resumeRoutes = require('./routes/resume');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/resume', resumeRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});