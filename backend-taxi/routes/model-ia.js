const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const router = express.Router();

// Load taxi data from CSV file and parse JSON columns
function loadTaxis(filePath = 'C:\\Users\\Aziz\\Desktop\\reservations.csv') {
  return new Promise((resolve, reject) => {
    const taxisData = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Parse JSON fields if they exist
        try {
          row.user_location = row.user_location ? JSON.parse(row.user_location) : {};
          row.weather = row.weather ? JSON.parse(row.weather) : {};
        } catch (error) {
          console.error("Error parsing JSON:", error);
          row.user_location = {};
          row.weather = {};
        }
        taxisData.push(row);
      })
      .on('end', () => {
        resolve(taxisData);
      })
      .on('error', (error) => {
        console.error("Error reading CSV file:", error);
        reject(error);
      });
  });
}

// Recommend a taxi based on criteria
function recommendTaxi(criteria, taxisData) {
  const filteredTaxis = taxisData.filter((taxi) => {
    const userLocation = taxi.user_location || {};
    const weather = taxi.weather || {};

    return (
      userLocation.lat === criteria.user_lat &&
      userLocation.lng === criteria.user_lng &&
      weather.description === criteria.weather &&
      Number(taxi.distance) >= criteria.distance
    );
  });

  if (filteredTaxis.length > 0) {
    return filteredTaxis[0].taxi_id ? parseInt(filteredTaxis[0].taxi_id) : null;
  } else {
    return null;
  }
}

// Load taxis data when the route is initialized
let taxisData = [];
loadTaxis().then((data) => {
  taxisData = data;
}).catch((error) => {
  console.error("Error loading taxis data:", error);
});

// POST endpoint for recommending a taxi
router.post('/recommend', (req, res) => {
  const criteria = req.body;
  console.log("Criteria received:", criteria);

  try {
    const recommendedTaxiId = recommendTaxi(criteria, taxisData);

    if (recommendedTaxiId !== null) {
      res.status(200).json({ taxi_id: recommendedTaxiId });
    } else {
      res.status(404).json({ message: "No taxi available for these criteria." });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
