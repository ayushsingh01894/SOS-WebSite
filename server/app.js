const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sosRoutes = require('./routes/sosRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true
//   })
// );
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Silent SOS API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/contacts', contactRoutes);
// Serve React frontend
const clientPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientPath));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(clientPath, 'index.html'));
// });
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});
app.use(notFound);
app.use(errorHandler);

module.exports = app;
