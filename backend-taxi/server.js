const express = require('express');
const cors = require('cors'); // Ajout de CORS
const path = require('path'); // Importation du module 'path'
const app = express();
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reservationsroutes = require('./routes/reservationsroutes');
const bodyParser = require('body-parser');
const model_ia = require('./routes/model-ia')
require('dotenv').config();
app.use(bodyParser.json());
app.use(express.json());
// Utiliser CORS pour autoriser les requêtes provenant de différentes origines
app.use(cors({
    origin: 'http://localhost:4200' // Remplacez par l'URL de votre frontend
})); 

app.use(express.json()); // Pour analyser le corps des requêtes JSON

// Middleware pour servir les fichiers statiques depuis le dossier "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Utiliser les routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/reservations', reservationsroutes);
app.use('/api', model_ia);



// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
