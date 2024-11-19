const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(async (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the MySQL database');

    // Variables pour l'administrateur par défaut
    const email = 'ajouini060@gmail.com';
    const nom = 'Jouini';
    const prenom = 'Aziz';
    const mot_de_passe = '123456';
    const type = 'admin';

    try {
      // Vérifier si l'utilisateur existe déjà
      const getUserIdQuery = `SELECT id FROM users WHERE email = ?`;
      db.query(getUserIdQuery, [email], async (getUserError, getUserResults) => {
        if (getUserError) {
          console.error("Erreur lors de la récupération de l'ID de l'utilisateur:", getUserError);
        } else if (getUserResults.length > 0) {
          console.log("Administrateur déjà présent dans la base de données");
        } else {
          // L'utilisateur n'existe pas, donc on le crée
          const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
          const insertQuery = `
            INSERT INTO users (nom, prenom, email, mot_de_passe, type, active) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          db.query(insertQuery, [nom, prenom, email, hashedPassword, type, true], (insertError, insertResults) => {
            if (insertError) {
              console.error("Erreur lors de l'insertion de l'administrateur:", insertError);
            } else {
              console.log("Nouvel administrateur ajouté avec succès");
            }
          });
        }
      });
    } catch (err) {
      console.error("Erreur lors de l'insertion de l'administrateur:", err);
    }
  }
});

module.exports = db;
