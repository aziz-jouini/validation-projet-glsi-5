// testTaxiRecommendation.js
const { recommendTaxi } = require('./taxiRecommendationModel');

async function testModel() {
    // Exemples de données de test
    const testCases = [
        { weatherDescription: 'Clear', time: '10:00:00', distance: 5, expected: 1 },
        { weatherDescription: 'Rainy', time: '22:00:00', distance: 12, expected: 2 },
        { weatherDescription: 'Partly cloudy', time: '15:00:00', distance: 8, expected: 1 },
        { weatherDescription: 'Clear', time: '03:00:00', distance: 20, expected: 2 },
        // Ajoutez d'autres cas de test pour couvrir différents scénarios
    ];

    for (let i = 0; i < testCases.length; i++) {
        const { weatherDescription, time, distance, expected } = testCases[i];
        const result = await recommendTaxi(weatherDescription, time, distance);

        console.log(`Test case ${i + 1}:`);
        console.log(`- Weather: ${weatherDescription}`);
        console.log(`- Time of day: ${time}`);
        console.log(`- Distance: ${distance}`);
        console.log(`- Expected recommendation: Taxi ${expected}`);
        console.log(`- Model recommendation: Taxi ${result > 0.5 ? 2 : 1}\n`);

        if ((result > 0.5 ? 2 : 1) === expected) {
            console.log(`✅ Test case ${i + 1} passed.\n`);
        } else {
            console.log(`❌ Test case ${i + 1} failed.\n`);
        }
    }
}

testModel()
    .then(() => console.log('Testing completed.'))
    .catch(error => console.error('Error during testing:', error));
