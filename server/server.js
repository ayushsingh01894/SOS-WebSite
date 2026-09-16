require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

initDatabase();

app.listen(PORT, () => {
  console.log(`Silent SOS backend running on http://localhost:${PORT}`);
});
