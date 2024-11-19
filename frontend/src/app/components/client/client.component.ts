import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AuthserviceService } from 'src/app/service/authservice.service';
import { TaxiService } from 'src/app/service/taxi.service';
import { WeatherService } from 'src/app/service/weather.service';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';


@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit, AfterViewInit {
  user = { firstName: '', lastName: '', derniere_connexion: '', role: '', id: 0 };
  isSidebarOpen = false;
  showPopup = false;
  showBookingPopup = false;
  availableTaxis: { id: number, proprietaire_nom: string, proprietaire_prenom: string, proprietaire_id: number }[] = [];
  selectedTaxi: any = null;
  bookingDate: string = '';
  weatherData: any = null;
  routeData: any = null;
  userLocation: { lat: number; lng: number } | null = null;
  destination: string = ''; // Destination must be an address or coordinates
  mapInBookingPopup: L.Map | null = null;
  marker: L.Marker | null = null;
  pickupLocation: string = '';
  costPer100m: number = 10; // Example cost per 100 meters
  geoCache = new Map(); // To cache the geocoded results
  
  constructor(
    private authservice: AuthserviceService,
    private taxiService: TaxiService,
    private weatherService: WeatherService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getUserProfile();
    this.getUserLocation();
  }

  ngAfterViewInit(): void {}

  getUserProfile(): void {
    this.authservice.getUserProfile().subscribe(
      (data) => {
        if (data) {
          this.user = {
            firstName: data.prenom || '',
            lastName: data.nom || '',
            derniere_connexion: data.derniere_connexion || '',
            role: data.type || '',
            id: data.id || 0
          };
          if (this.user.derniere_connexion) {
            this.user.derniere_connexion = new Date(this.user.derniere_connexion).toLocaleString();
          }
          this.cdr.detectChanges();
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
      }
    );
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.getWeatherData(this.userLocation.lat, this.userLocation.lng);
          this.updatePickupLocation();
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please check your settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  getWeatherData(lat: number, lng: number): void {
    this.weatherService.getWeather(lat, lng).subscribe(
      (data) => {
        if (data) {
          this.weatherData = {
            icon: data.current.condition.icon,
            description: data.current.condition.text,
            temperature: data.current.temp_c
          };
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des données météorologiques:', error);
      }
    );
  }

  showAvailableTaxis(): void {
    this.taxiService.getAvailableTaxis().subscribe(
      (taxis) => {
        this.availableTaxis = taxis;
        this.showPopup = true;
      },
      (error) => {
        console.error('Erreur lors de la récupération des taxis:', error);
      }
    );
  }

  openBookingPopup(taxi: any): void {
    this.selectedTaxi = taxi;
    this.showBookingPopup = true;
    setTimeout(() => {
      this.initMapInBookingPopup();
    }, 100); // Delay added to ensure the popup is rendered before initializing the map
  }

  closeBookingPopup(): void {
    this.showBookingPopup = false;
    this.selectedTaxi = null;
    if (this.mapInBookingPopup) {
      this.mapInBookingPopup.remove();
      this.mapInBookingPopup = null;
    }
  }

  initMapInBookingPopup(): void {
    if (!this.mapInBookingPopup && this.userLocation) {
      this.mapInBookingPopup = L.map('map-popup', { zoomControl: false }).setView([this.userLocation.lat, this.userLocation.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.mapInBookingPopup);
      this.marker = L.marker([this.userLocation.lat, this.userLocation.lng]).addTo(this.mapInBookingPopup)
        .bindPopup('Votre position actuelle')
        .openPopup();
    }
  }

  async calculateRoute(): Promise<void> {
    if (this.destination && this.userLocation) {
      try {
        const destinationCoords = await this.geocodeAddress(this.destination); // Fetch coordinates dynamically

        if (destinationCoords) {
          // Afficher les coordonnées de la destination dans la console
          console.log('Coordonnées de la destination:', destinationCoords);
          
          const distance = this.calculateDistance(this.userLocation, destinationCoords);
          const { travelTime, arrivalTime } = this.calculateTravelTime(distance);
          const cost = this.calculateCost(distance);
    
          this.routeData = {
            distance: distance,
            price: cost,
            travelTime: travelTime,
            arrivalTime: arrivalTime
          };
        }
      } catch (error) {
        console.error('Error fetching destination coordinates:', error);
      }
    }
  }

  async geocodeAddress(address: string, lang: string = 'fr'): Promise<{ lat: number; lng: number } | null> {
    if (this.geoCache.has(address)) {
      return this.geoCache.get(address)!;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=${lang}`;

    try {
      const results = await this.http.get<any[]>(url).toPromise();
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };
        this.geoCache.set(address, coordinates);
        return coordinates;
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Error fetching coordinates from Nominatim:', error);
      throw new Error('Unable to retrieve coordinates for the destination address.');
    }
  }

  confirmBooking(): void {
    if (this.selectedTaxi && this.routeData) {
        // Extraire et formater les valeurs tout en vérifiant leur existence
        const departureTime = new Date().toISOString().split('T')[1]?.slice(0, 8) || "00:00:00";  // Départ de l'heure actuelle
        const arrivalTime = this.routeData.arrivalTime ? 
            this.routeData.arrivalTime.split('T')[1]?.slice(0, 8) : "00:00:00";  // Si la route a une heure d'arrivée

        // Formatage de travelTime en minutes (si nécessaire)
        const travelTimeInMinutes = this.routeData.travelTime ? this.convertToMinutes(this.routeData.travelTime) : 0;

        const bookingData = {
            taxi_id: this.selectedTaxi.id,  // ID du taxi
            proprietaire_id: this.selectedTaxi.proprietaire_id,  // ID du propriétaire du taxi
            userLocation: this.userLocation ? JSON.stringify(this.userLocation) : null,  // Localisation de l'utilisateur (JSON)
            destination: this.destination,  // Destination
            distance: this.routeData.distance,  // Distance
            travelTime: travelTimeInMinutes,  // Temps de trajet en minutes
            departureTime,  // Heure de départ
            arrivalTime,  // Heure d'arrivée
            travelCost: this.routeData.price,  // Coût du trajet
            weather: this.weatherData ? JSON.stringify(this.weatherData) : null,  // Météo (JSON)
            proprietaire_nom: this.selectedTaxi.proprietaire_nom,  // Nom du propriétaire
            proprietaire_prenom: this.selectedTaxi.proprietaire_prenom  // Prénom du propriétaire
        };

        const token = localStorage.getItem('token');

        if (token) {
            const headers = { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            this.http.post('http://localhost:3000/api/reservations/create-reservation', bookingData, { headers }).subscribe(
                (response) => {
                    console.log('Réservation confirmée:', response);
                    alert('Réservation confirmée avec succès!');
                },
                (error) => {
                    console.error('Erreur lors de la confirmation de la réservation:', error);
                    alert('Erreur lors de la création de la réservation.');
                }
            );
        } else {
            console.error('Token d\'authentification manquant');
            alert('Token d\'authentification manquant. Veuillez vous reconnecter.');
        }
    } else {
        console.error("Les données de taxi ou de route sont manquantes.");
        alert("Veuillez sélectionner un taxi et une route valides.");
    }

    this.closeBookingPopup();  // Fermer le popup de réservation après l'envoi
}

// Fonction pour convertir un temps au format HH:MM en minutes
convertToMinutes(timeString: string): number {
    if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours * 60) + minutes;  // Convertit en minutes
    }
    return 0;  // Valeur par défaut si aucun temps n'est fourni
}


  closePopup(): void {
    this.showPopup = false;
  }

  updatePickupLocation(): void {
    if (this.userLocation) {
      this.pickupLocation = `Latitude: ${this.userLocation.lat}, Longitude: ${this.userLocation.lng}`;
    }
  }

  calculateDistance(start: { lat: number; lng: number }, end: { lat: number; lng: number }): number {
    const earthRadius = 6371; // in km
    const dLat = this.degreesToRadians(end.lat - start.lat);
    const dLng = this.degreesToRadians(end.lng - start.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(start.lat)) *
        Math.cos(this.degreesToRadians(end.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c; // Distance in km
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  calculateTravelTime(distance: number): { travelTime: string; arrivalTime: string } {
    const avgSpeed = 50; // Assume an average speed of 50 km/h
    const travelTimeMinutes = (distance / avgSpeed) * 60; // in minutes
    const travelTime = this.formatTime(travelTimeMinutes);

    const departureTime = new Date();
    const arrivalTime = new Date(departureTime.getTime() + travelTimeMinutes * 60000);
    const formattedArrivalTime = arrivalTime.toISOString();

    return { travelTime, arrivalTime: formattedArrivalTime };
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}:${mins < 10 ? '0' + mins : mins}`;
  }

  calculateCost(distance: number): number {
    return Math.round((distance / 100) * this.costPer100m); // Cost for every 100 meters
  }





  openSidebar(): void {
    this.isSidebarOpen = true;
  }

  // Method to close the sidebar
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
  
  showReservationsPopup = false;
  reservations: any[] = []; // Store reservations

  // Method to fetch reservations
  showReservations(): void {
    const token = localStorage.getItem('token'); // Récupération directe du token depuis localStorage
  
    if (this.user.id && token) { // Vérifiez que l'utilisateur est connecté et qu'un token est disponible
      this.http
        .get(`http://localhost:3000/api/reservations/reservations`, {
          headers: { Authorization: `Bearer ${token}` }, // Ajout du token dans l'en-tête
        })
        .subscribe(
          (data: any) => {
            this.reservations = data.reservations; // Stocker les données reçues
            this.showReservationsPopup = true; // Afficher le popup
          },
          (error) => {
            console.error('Erreur lors de la récupération des réservations:', error); // Gérer les erreurs
          }
        );
    } else {
      console.warn('Utilisateur non connecté ou token manquant.');
    }
  }
  

  // Method to close the reservations popup
  closeReservationsPopup(): void {
    this.showReservationsPopup = false;
  }
  submitFeedback(reservationId: number, rating: number, comment: string): void {
    const feedbackData = { reservationId, rating, comment };

    this.http.post('http://localhost:3000/api/reservations/feedback', feedbackData, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    .subscribe(
      (response) => {
        console.log('Feedback submitted:', response);
        // You could show a success message here
      },
      (error) => {
        console.error('Error submitting feedback:', error);
      }
    );
  }

  token = localStorage.getItem('token'); // Retrieve the token from localStorage
  userMessage: string = '';  // Le message que l'utilisateur envoie au chatbot
  chatbotResponse: string = '';  // La réponse du chatbot
  showChatbot: boolean = false;  // Variable pour afficher ou masquer la fenêtre du chatbot
// Méthode pour envoyer le message au chatbot
sendMessage(): void {
  const apiUrl = 'http://localhost:5002/chat'; // Remplacez cette URL par l'URL de l'API de votre chatbot
  const messagePayload = { question: this.userMessage };  // Changez "message" en "question"

  this.http.post<any>(apiUrl, messagePayload).subscribe(
    (response) => {
      this.chatbotResponse = response.answer;  // Réponse du chatbot (clée "answer" côté serveur)
    },
    (error) => {
      console.error('Erreur lors de l\'envoi du message au chatbot', error);
    }
  );
}


// Méthode pour afficher ou masquer la fenêtre du chatbot
toggleChatbot() {
  this.showChatbot = !this.showChatbot;
}
}
