const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');



const convertToMinutes = (timeString) => {
    if (timeString && typeof timeString === 'string') {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            return (hours * 60) + minutes;  // Convertit en minutes
        }
    }
    return null;  // Retourne null si le format n'est pas correct
};

router.post('/create-reservation', authMiddleware, async (req, res) => {
    console.log('Données reçues:', req.body);  // Log des données envoyées par le frontend
    console.log('Utilisateur connecté:', req.user);  // Vérifier l'utilisateur authentifié

    if (req.user.type !== 'client') {
        return res.status(403).json({ message: 'Seuls les clients peuvent créer des réservations.' });
    }

    // Extraire les valeurs avec gestion des valeurs undefined
    const {
        taxi_id,
        proprietaire_id,
        proprietaire_nom,
        proprietaire_prenom,
        userLocation,
        destination,
        distance,
        travelTime,
        departureTime,
        arrivalTime,
        travelCost,
        weather
    } = req.body;

    // Validation des données avant insertion
    if (!taxi_id || !proprietaire_id || !destination || !travelCost) {
        return res.status(400).json({ message: 'Certaines données nécessaires sont manquantes.' });
    }

    console.log("Validation des données :");
    console.log("Departure Time: ", departureTime);
    console.log("Arrival Time: ", arrivalTime);

    // Vérification des temps de départ et d'arrivée
    const formatTimeToISO = (timeString) => {
        // Utiliser une date fictive et concaténer l'heure
        if (timeString) {
            const [hours, minutes, seconds] = timeString.split(':');
            return `1970-01-01T${hours}:${minutes}:${seconds}`;  // Correction de la chaîne
        }
        return null;
    };

    const formattedDepartureTime = formatTimeToISO(departureTime);
    const formattedArrivalTime = formatTimeToISO(arrivalTime);

    console.log("Formatted Departure Time: ", formattedDepartureTime);
    console.log("Formatted Arrival Time: ", formattedArrivalTime);

    try {
        const reservationValues = [
            req.user.id,  // user_id
            taxi_id,  // taxi_id
            proprietaire_id,  // proprietaire_id
            proprietaire_nom,  // proprietaire_nom
            proprietaire_prenom,  // proprietaire_prenom
            userLocation ? JSON.stringify(userLocation) : null,  // user_location
            destination,  // destination
            distance,  // distance
            convertToMinutes(travelTime),  // travel_time (convertit en minutes)
            formattedDepartureTime,  // departure_time (format DATETIME)
            formattedArrivalTime,  // arrival_time (format DATETIME)
            travelCost,  // travel_cost
            weather ? JSON.stringify(weather) : null  // weather (stocké en JSON)
        ];

        console.log("Valeurs à insérer dans la base de données:", reservationValues);

        const results = await db.execute(
            `INSERT INTO reservations (
                user_id,
                taxi_id,
                proprietaire_id,
                proprietaire_nom,   
                proprietaire_prenom, 
                user_location,
                destination,
                distance,
                travel_time,
                departure_time,
                arrival_time,
                travel_cost,
                weather
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, reservationValues
        );

        console.log('Insertion réussie:', results);  // Log des résultats de l'insertion

        res.status(201).json({
            message: 'Réservation créée avec succès.',
            reservationId: results.insertId,
            details: {
                travelTime: `${travelTime} minutes`,  // Correction de la syntaxe de la réponse
                travelCost: `${travelCost} €`  // Correction de la syntaxe de la réponse
            }
        });
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error.message);
        res.status(500).json({ 
            message: 'Erreur lors de la création de la réservation.', 
            error: error.message 
        });
    }
});

// Route pour récupérer les réservations du client connecté
router.get('/reservations', authMiddleware, (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    console.log("Fetching reservations for user ID:", userId);

    db.query(`
        SELECT 
            id AS reservationId,
            taxi_id AS taxiId,
            proprietaire_nom AS proprietaireNom,
            proprietaire_prenom AS proprietairePrenom,
            user_location AS userLocation,
            destination,
            distance,
            travel_time AS travelTime,
            departure_time AS departureTime,
            arrival_time AS arrivalTime,
            travel_cost AS travelCost,
            weather
        FROM reservations
        WHERE user_id = ?
        ORDER BY departure_time DESC
    `, [userId], (error, results) => {
        if (error) {
            console.error('Error executing query:', error.message);
            return res.status(500).json({ message: 'Erreur lors de la récupération des réservations.', error: error.message });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Aucune réservation trouvée pour cet utilisateur.' });
        }

        const formattedReservations = results.map(reservation => ({
            ...reservation,
            userLocation: (() => {
                try {
                    return reservation.userLocation ? JSON.parse(reservation.userLocation) : null;
                } catch {
                    console.warn('Données mal formées dans userLocation:', reservation.userLocation);
                    return null;
                }
            })(),
            weather: (() => {
                try {
                    return reservation.weather ? JSON.parse(reservation.weather) : null;
                } catch {
                    console.warn('Données mal formées dans weather:', reservation.weather);
                    return null;
                }
            })(),
            travelTime: `${reservation.travelTime} minutes`,
            travelCost: `${reservation.travelCost} €`
        }));

        res.status(200).json({
            message: 'Réservations récupérées avec succès.',
            reservations: formattedReservations
        });
    });
});
router.get('/admin/reservations', authMiddleware, (req, res) => {
    // Vérification si l'utilisateur est un admin
    if (req.user.type !== 'admin') {
        return res.status(403).json({ message: 'Accès interdit. Vous devez être administrateur.' });
    }

    console.log("Fetching all reservations for admin");

    // Requête pour récupérer toutes les réservations
    db.query(`
        SELECT 
            id AS reservationId,
            taxi_id AS taxiId,
            user_id AS userId,
            proprietaire_nom AS proprietaireNom,
            proprietaire_prenom AS proprietairePrenom,
            user_location AS userLocation,
            destination,
            distance,
            travel_time AS travelTime,
            departure_time AS departureTime,
            arrival_time AS arrivalTime,
            travel_cost AS travelCost,
            weather
        FROM reservations
        ORDER BY departure_time DESC
    `, (error, results) => {
        if (error) {
            console.error('Error executing query:', error.message);
            return res.status(500).json({ message: 'Erreur lors de la récupération des réservations.', error: error.message });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Aucune réservation trouvée.' });
        }

        const formattedReservations = results.map(reservation => ({
            ...reservation,
            userLocation: (() => {
                try {
                    return reservation.userLocation ? JSON.parse(reservation.userLocation) : null;
                } catch {
                    console.warn('Données mal formées dans userLocation:', reservation.userLocation);
                    return null;
                }
            })(),
            weather: (() => {
                try {
                    return reservation.weather ? JSON.parse(reservation.weather) : null;
                } catch {
                    console.warn('Données mal formées dans weather:', reservation.weather);
                    return null;
                }
            })(),
            travelTime: `${reservation.travelTime} minutes`,
            travelCost: `${reservation.travelCost} €`
        }));

        res.status(200).json({
            message: 'Réservations récupérées avec succès.',
            reservations: formattedReservations
        });
    });
});
// Route pour récupérer les réservations du propriétaire connecté
// Route pour récupérer les réservations du propriétaire connecté
// Route pour récupérer les réservations du propriétaire connecté
// Route pour récupérer les réservations du propriétaire connecté
router.get('/proprietaire/reservations', authMiddleware, (req, res) => {
    const proprietaireId = req.user.id; // ID du propriétaire connecté

    // Vérification si l'utilisateur est un propriétaire
    if (req.user.type !== 'proprietaire') {
        return res.status(403).json({ message: 'Accès interdit. Vous devez être propriétaire.' });
    }

    console.log(`Fetching reservations for owner with ID: ${proprietaireId}`);

    // Requête pour récupérer les réservations des taxis appartenant au propriétaire connecté
    db.query(`
        SELECT 
            r.id AS reservationId,
            r.taxi_id AS taxiId,
            r.user_id AS userId,
            r.proprietaire_nom AS proprietaireNom,
            r.proprietaire_prenom AS proprietairePrenom,
            r.user_location AS userLocation,
            r.destination,
            r.distance,
            r.travel_time AS travelTime,
            r.departure_time AS departureTime,
            r.arrival_time AS arrivalTime,
            r.travel_cost AS travelCost,
            r.weather
        FROM reservations r
        WHERE r.proprietaire_id = ?  -- Utilisation de l'ID du propriétaire connecté
        ORDER BY r.departure_time DESC
    `, [proprietaireId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des réservations:', error.message);
            return res.status(500).json({ message: 'Erreur lors de la récupération des réservations.', error: error.message });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Aucune réservation trouvée pour ce propriétaire.' });
        }

        // Formater les résultats des réservations
        const formattedReservations = results.map(reservation => ({
            ...reservation,
            userLocation: (() => {
                try {
                    return reservation.userLocation ? JSON.parse(reservation.userLocation) : null;
                } catch {
                    console.warn('Données mal formées dans userLocation:', reservation.userLocation);
                    return null;
                }
            })(),
            weather: (() => {
                try {
                    return reservation.weather ? JSON.parse(reservation.weather) : null;
                } catch {
                    console.warn('Données mal formées dans weather:', reservation.weather);
                    return null;
                }
            })(),
            travelTime: `${reservation.travelTime} minutes`,
            travelCost: `${reservation.travelCost} €`
        }));

        res.status(200).json({
            message: 'Réservations récupérées avec succès.',
            reservations: formattedReservations
        });
    });
});
router.post('/feedback', authMiddleware, (req, res) => {
    const { reservationId, rating, comment } = req.body;

    // Vérifier que l'utilisateur est un client
    if (req.user.type !== 'client') {
        return res.status(403).json({ message: 'Seuls les clients peuvent soumettre un feedback.' });
    }

    // Vérifier que la réservation existe et appartient à l'utilisateur
    db.query('SELECT * FROM reservations WHERE id = ? AND user_id = ?', [reservationId, req.user.id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête:', err);
            return res.status(500).json({ message: 'Erreur de serveur.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Réservation non trouvée ou vous n\'êtes pas autorisé à donner un feedback.' });
        }

        // Validation de la note
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5.' });
        }

        const feedbackValues = [
            reservationId,  // reservation_id
            req.user.id,  // user_id
            rating,  // rating
            comment || null  // comment (optionnel)
        ];

        // Insertion du feedback dans la base de données
        db.query('INSERT INTO feedback (reservation_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', feedbackValues, (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'enregistrement du feedback:', err);
                return res.status(500).json({ message: 'Erreur lors de la soumission du feedback.' });
            }

            res.status(201).json({ message: 'Feedback soumis avec succès.' });
        });
    });
});
router.get('/feedback/:reservationId', authMiddleware, async (req, res) => {
    const reservationId = req.params.reservationId;
    const userId = req.user.id; // Récupère l'ID de l'utilisateur authentifié
    
    try {
      // Vérifier si la réservation existe
      const [reservation] = await db.query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
      
      if (!reservation) {
        return res.status(404).json({ message: 'Réservation non trouvée.' });
      }
      
      // Vérifier si l'utilisateur est le propriétaire
      if (reservation.owner_id !== userId) {
        return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette réservation.' });
      }
      
      // Récupérer les feedbacks
      const [feedbacks] = await db.query('SELECT * FROM feedback WHERE reservation_id = ?', [reservationId]);
      
      if (!feedbacks || feedbacks.length === 0) {
        return res.status(404).json({ message: 'Aucun feedback trouvé pour cette réservation.' });
      }
      
      res.status(200).json({ message: 'Feedbacks récupérés avec succès.', feedbacks });
    } catch (error) {
      console.error('Erreur lors de la récupération des feedbacks:', error.message);
      res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
  });
  

module.exports = router;
