const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sosRoutes = require('./routes/sosRoutes');
const contactRoutes = require('./routes/contactRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);

/* =========================
   BODY PARSER
========================= */

app.use(express.json());

/* =========================
   API ROUTES
========================= */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/contacts', contactRoutes);

/* =========================
   SERVE REACT FRONTEND
========================= */

const clientPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientPath));

/* =========================
   REACT ROUTING
========================= */

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

/* =========================
   ERROR HANDLING
========================= */

app.use(notFound);
app.use(errorHandler);

module.exports = app;