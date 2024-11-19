const tf = require('@tensorflow/tfjs-node');
const db = require('../db');

// Encodage de la condition météo
const encodeWeatherCondition = (condition) => {
    if (condition.includes('Clear')) return 1;
    if (condition.includes('cloudy')) return 2;
    if (condition.includes('rain')) return 3;
    return 0; // Autres conditions
};

// Encodage de l'heure du jour (jour = 1, nuit = 0)
const encodeTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= 6 && hour < 18 ? 1 : 0; // Jour ou nuit
};

// Récupération et formatage des données depuis la base de données
const fetchTrainingData = async () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT weather, distance, departure_time FROM reservations';
        db.query(query, (err, results) => {
            if (err) return reject(err);

            const formattedData = results.map((row) => {
                const weatherData = JSON.parse(row.weather); // Si stocké en JSON
                return {
                    weather: encodeWeatherCondition(weatherData.description),
                    distance: parseFloat(row.distance),
                    timeOfDay: encodeTimeOfDay(row.departure_time),
                };
            });

            resolve(formattedData);
        });
    });
};

// Création et entraînement du modèle
const createAndTrainModel = async () => {
    const trainingData = await fetchTrainingData();

    const inputs = trainingData.map(data => [data.weather, data.timeOfDay, data.distance]);
    const labels = trainingData.map(data => [data.distance > 10 ? 2 : 1]); // Taxi 1 pour courtes distances, 2 pour longues

    // Construction du modèle
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [3], units: 10, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Sortie binaire

    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

    // Conversion des données en tenseurs
    const inputTensor = tf.tensor2d(inputs);
    const labelTensor = tf.tensor2d(labels);

    await model.fit(inputTensor, labelTensor, {
        epochs: 100,
        batchSize: 4,
    });

    inputTensor.dispose();
    labelTensor.dispose();

    return model;
};

// Fonction de recommandation pour le type de taxi
const recommendTaxi = async (weatherDescription, time, distance) => {
    const model = await createAndTrainModel();
    const input = tf.tensor2d([
        [encodeWeatherCondition(weatherDescription), encodeTimeOfDay(time), distance]
    ]);

    const output = model.predict(input);
    const recommendation = output.dataSync()[0];
    input.dispose();
    output.dispose();

    return recommendation > 0.5 ? 2 : 1; // Retourne le type de taxi recommandé
};

module.exports = { recommendTaxi };
