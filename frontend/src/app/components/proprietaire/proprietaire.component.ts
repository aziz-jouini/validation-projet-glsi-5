import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthserviceService } from 'src/app/service/authservice.service';
import { TaxiService } from 'src/app/service/taxi.service';

@Component({
  selector: 'app-proprietaire',
  templateUrl: './proprietaire.component.html',
  styleUrls: ['./proprietaire.component.scss']
})
export class ProprietaireComponent implements OnInit {
  user = {
    firstName: '',
    lastName: '',
    derniere_connexion: '',
    role: '',
    id: 0
  };
  response: string = '';
  isSidebarOpen = false;
  selectedImage: File | null = null;
  similarImages: string[] = [];
  isRecommendationPopupOpen = false;
  taxis: any[] = [];
  purchasedTaxis: any[] = [];
  isPurchasedTaxisPopupOpen = false;

  constructor(
    private authservice: AuthserviceService,
    private taxiservice: TaxiService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getUserProfile();
    this.loadTaxis();
  }

  openSidebar(): void {
    this.isSidebarOpen = true;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  getUserProfile(): void {
    this.authservice.getUserProfile().subscribe(
      (data) => {
        this.user = {
          firstName: data.prenom,
          lastName: data.nom,
          derniere_connexion: data.derniere_connexion,
          role: data.type,
          id: data.id
        };
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
      }
    );
  }

  loadTaxis(): void {
    this.taxiservice.getTaxis().subscribe(
      (data) => {
        this.taxis = data;
        this.loadPurchasedTaxis(); // Charger aussi les taxis achetés
      },
      (error) => console.error('Erreur lors de la récupération des taxis:', error)
    );
  }

  loadPurchasedTaxis(): void {
    this.taxiservice.getPurchasedTaxis().subscribe(
      (data) => {
        // Update the list with data from the backend
        this.purchasedTaxis = data;
  
        // Parse stored taxis from localStorage to get reservation status
        const storedTaxis: { id: number; reserved: boolean }[] = JSON.parse(localStorage.getItem('purchasedTaxis') || '[]');
        
        // Match and set reservation status for each taxi
        this.purchasedTaxis.forEach(taxi => {
          const storedTaxi = storedTaxis.find((st: { id: number; reserved: boolean }) => st.id === taxi.id);
          if (storedTaxi) {
            taxi.reserved = storedTaxi.reserved;
          }
        });
  
        // Update localStorage with the new list
        localStorage.setItem('purchasedTaxis', JSON.stringify(this.purchasedTaxis));
      },
      (error) => console.error('Erreur lors de la récupération des taxis achetés:', error)
    );
  }
  

  reserveTaxi(taxiId: number): void {
    this.taxiservice.reserveTaxi(taxiId).subscribe(
      () => {
        const taxi = this.purchasedTaxis.find(t => t.id === taxiId);
        if (taxi) {
          taxi.reserved = true;
          localStorage.setItem('purchasedTaxis', JSON.stringify(this.purchasedTaxis));
        }
      },
      (error) => console.error('Erreur lors de la réservation du taxi:', error)
    );
  }
  
  cancelReservation(taxiId: number): void {
    this.taxiservice.cancelReservation(taxiId).subscribe(
      () => {
        const taxi = this.purchasedTaxis.find(t => t.id === taxiId);
        if (taxi) {
          taxi.reserved = false;
          localStorage.setItem('purchasedTaxis', JSON.stringify(this.purchasedTaxis));
        }
      },
      (error) => console.error('Erreur lors de l\'annulation de la réservation du taxi:', error)
    );
  }
  
  openRecommendationPopup(): void {
    this.isRecommendationPopupOpen = true;
  }

  closeRecommendationPopup(): void {
    this.isRecommendationPopupOpen = false;
    this.similarImages = [];
  }

  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  sendImage() {
    if (this.selectedImage) {
      this.taxiservice.sendImage(this.selectedImage).subscribe(
        (response) => {
          console.log('Réponse de l\'API:', response);
  
          this.response = response.response;
          // Extraire les URLs d'images et les convertir en tableau
          const imageString = response.response.match(/\[(.*?)\]/);
          if (imageString && imageString[1]) {
            this.similarImages = imageString[1].split(',').map((url: string) => url.trim().replace(/['"]+/g, ''));
          }
        },
        (error) => {
          console.error('Erreur lors de l\'envoi de l\'image', error);
        }
      );
    }
  }
  
  
  

  acheterTaxi(proprietaireId: number, taxiId: number): void {
    this.taxiservice.acheterTaxi(proprietaireId, taxiId).subscribe(
      (response) => {
        console.log('Taxi acheté avec succès:', response);
        this.loadTaxis(); // Recharger les taxis pour refléter l'achat
      },
      (error) => {
        console.error('Erreur lors de l\'achat du taxi:', error);
      }
    );
  }

  openPurchasedTaxisPopup(): void {
    this.isPurchasedTaxisPopupOpen = true;
  }

 
isChatbotVisible: boolean = false;

  // Méthode pour basculer l'affichage du chatbot
  toggleChatbot(): void {
    this.isChatbotVisible = !this.isChatbotVisible;
  }
  reservations: any[] = [];
  showReservationsPopup = false;
  showReservations(): void {
    const token = localStorage.getItem('token');
  
    if (this.user.id && token) {
      this.http
        .get(`http://localhost:3000/api/reservations/proprietaire/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe(
          (data: any) => {
            this.reservations = data.reservations;
  
            // Vérifier que chaque réservation a un ID valide
            this.reservations.forEach((reservation: any) => {
              if (reservation.reservationId) {  // Utilisez reservation.reservationId au lieu de reservation.id
                this.http
                  .get(`http://localhost:3000/api/reservations/feedback/${reservation.reservationId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  .subscribe(
                    (feedbackData: any) => {
                      reservation.feedback = feedbackData.feedback; // Assigner les feedbacks à la réservation
                    },
                    (error) => {
                      console.error(`Erreur lors de la récupération des feedbacks pour la réservation ${reservation.reservationId}:`, error);
                    }
                  );
              } else {
                console.error('Réservation sans ID:', reservation);
              }
            });
  
            this.showReservationsPopup = true;
          },
          (error) => {
            console.error('Erreur lors de la récupération des réservations:', error);
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
}