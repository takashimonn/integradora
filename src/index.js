const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware para leer JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Node.js funcionando 🔥');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
