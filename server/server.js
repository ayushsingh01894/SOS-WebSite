const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = require('./app');
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

initDatabase();

app.listen(PORT, () => {
  console.log(`Silent SOS backend running on http://localhost:${PORT}`);
});
