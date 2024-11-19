const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');


// Route pour récupérer la liste des utilisateurs (Admin uniquement)
router.get('/users', authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  // Requête pour récupérer tous les utilisateurs
  const query = `SELECT id, nom, prenom, email, type, derniere_connexion active FROM users`;
  db.execute(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
    }

    res.json(results);
  });
});

// Route pour désactiver un utilisateur (Admin uniquement)
router.post('/deactivate', authMiddleware, (req, res) => {
  const { userId } = req.body;

  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }
   
  // Requête pour désactiver un utilisateur par ID
  const query = `UPDATE users SET active = FALSE WHERE id = ?`;
  db.execute(query, [userId], (err, results) => {
    if (err || results.affectedRows === 0) {
      return res.status(500).json({ message: 'Erreur lors de la désactivation.' });
    }
    res.json({ message: 'Utilisateur désactivé avec succès.' });
  });
});

// Route pour supprimer un utilisateur (Admin uniquement)
router.delete('/delete/:id', authMiddleware, (req, res) => {
  const userId = req.params.id;

  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  // Requête pour supprimer un utilisateur par ID
  const query = `DELETE FROM users WHERE id = ?`;
  db.execute(query, [userId], (err, results) => {
    if (err || results.affectedRows === 0) {
      return res.status(500).json({ message: 'Erreur lors de la suppression de l’utilisateur.' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès.' });
  });
});

// Route pour activer un utilisateur (Admin uniquement)
router.post('/activate', authMiddleware, (req, res) => {
  const { userId } = req.body;

  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  const query = `UPDATE users SET active = TRUE WHERE id = ?`;
  db.execute(query, [userId], (err, results) => {
    if (err || results.affectedRows === 0) {
      return res.status(500).json({ message: 'Erreur lors de l’activation.' });
    }
    res.json({ message: 'Utilisateur activé avec succès.' });
  });
});
// Configurer multer pour gérer l'upload des images de taxi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nom de fichier unique
  }
});

const upload = multer({ storage });


router.post('/add', authMiddleware, upload.single('photo_de_taxi'), (req, res) => {
  const { nom, matricule, prix } = req.body;

  // Vérifiez que tous les champs requis sont présents
  if (!nom || !matricule || !prix) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  // Vérifiez si le fichier a été uploadé
  if (!req.file) {
    return res.status(400).json({ message: 'Le fichier photo_de_taxi est requis.' });
  }

  const photo_de_taxi = req.file.path; // Récupérez le chemin du fichier uploadé

  // Récupérer l'ID de l'utilisateur à partir du middleware d'authentification
  const user_id = req.user.id;
  console.log("User ID:", user_id);

  const query = `INSERT INTO taxi (nom, matricule, photo_de_taxi, prix, user_id) VALUES (?, ?, ?, ?, ?)`;

  // Logs pour vérifier les valeurs
  console.log('Nom:', nom);
  console.log('Matricule:', matricule);
  console.log('Prix:', prix);
  console.log('Photo de Taxi:', photo_de_taxi);

  db.execute(query, [nom, matricule, photo_de_taxi, prix, user_id], (err, results) => {
      if (err) {
          console.error('Erreur lors de l\'ajout du taxi:', err);
          return res.status(500).json({ message: 'Erreur lors de l\'ajout du taxi.', error: err.message });
      }
      res.status(201).json({ message: 'Taxi ajouté avec succès.', taxiId: results.insertId });
  });
});
// Route pour récupérer la liste des taxis
router.get('/list-taxi', authMiddleware, (req, res) => {
  console.log('Requête reçue pour récupérer les taxis');
  
  if (!['admin', 'proprietaire'].includes(req.user.type)) {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  const query = `SELECT id, nom, matricule, CONCAT('http://localhost:3000/', photo_de_taxi) AS photo_de_taxi, prix, created_at FROM taxi`;
  
  db.execute(query, (err, results) => {
    if (err) {
      console.error('Erreur dans la requête SQL:', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des taxis.' });
    }

    console.log('Résultats des taxis:', results);
    res.json(results);
  });
});



// Route pour supprimer un taxi (Admin uniquement)
router.delete('/delete/taxi/:id', authMiddleware, (req, res) => {
  const taxiId = req.params.id;

  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  // Requête pour supprimer un taxi par ID
  const query = `DELETE FROM taxi WHERE id = ?`;
  db.execute(query, [taxiId], (err, results) => {
    if (err || results.affectedRows === 0) {
      return res.status(500).json({ message: 'Erreur lors de la suppression du taxi.' });
    }
    res.json({ message: 'Taxi supprimé avec succès.' });
  });
});

// Route pour mettre à jour un taxi (Admin uniquement)
router.put('/update/taxi/:id', authMiddleware, upload.single('photo_de_taxi'), (req, res) => {
  const taxiId = req.params.id;
  const { nom, matricule, prix } = req.body;

  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  // Vérifier que tous les champs requis sont présents
  if (!nom || !matricule || !prix) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  // Construire la requête de mise à jour et les paramètres
  let query = `UPDATE taxi SET nom = ?, matricule = ?, prix = ?`;
  let params = [nom, matricule, prix];

  // Si une nouvelle photo est fournie, on l'ajoute à la mise à jour
  if (req.file) {
    query += `, photo_de_taxi = ?`;
    params.push(req.file.path);
  }

  query += ` WHERE id = ?`;
  params.push(taxiId);

  // Exécuter la requête de mise à jour
  db.execute(query, params, (err, results) => {
    if (err || results.affectedRows === 0) {
      console.error('Erreur lors de la mise à jour du taxi:', err);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour du taxi.' });
    }
    res.json({ message: 'Taxi mis à jour avec succès.' });
  });
});
// Route pour récupérer un taxi par son ID (Admin uniquement)
router.get('/taxi/:id', authMiddleware, (req, res) => {
  const taxiId = req.params.id;

  // Vérifier si l'utilisateur est un administrateur
  if (req.user.type !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit.' });
  }

  // Requête pour récupérer un taxi par ID
  const query = `SELECT id, nom, matricule, photo_de_taxi, prix, created_at FROM taxi WHERE id = ?`;
  db.execute(query, [taxiId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la récupération du taxi.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Taxi non trouvé.' });
    }

    res.json(results[0]);
  });
  // Route pour créer une réservation (Client uniquement)

  
});





module.exports = router;
