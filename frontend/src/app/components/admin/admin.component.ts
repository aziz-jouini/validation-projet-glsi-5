import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthserviceService } from 'src/app/service/authservice.service';
import { TaxiService } from 'src/app/service/taxi.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  taxis: any[] = [];
  newTaxi = {
    nom: '',
    matricule: '',
    prix: 0,
    photo_de_taxi: null
  };
  selectedFile: File | null = null;
  user = {
    id: '', // Ajout de l'ID ici
    firstName: '',
    lastName: '',
    derniere_connexion: '',
    role: '',
  };
  isEditPopupOpen = false;
  isViewPopupOpen = false;
  editTaxi: any = {};
  viewTaxi: any = {};
  isPopupVisible2 = false;
  isPopupVisible = false; // State to toggle popup visibility
  isSidebarOpen = false; // State to toggle sidebar visibility

  reservations: any[] = [];
  showReservationsPopup = false;

  constructor(
    private authservice: AuthserviceService,
    private taxiservice: TaxiService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  // Method to get user profile
  getUserProfile(): void {
    this.authservice.getUserProfile().subscribe(
      (data) => {
        this.user = {
          id: data.id, // Assurez-vous que l'ID est renvoyé par le backend
          firstName: data.prenom,
          lastName: data.nom,
          derniere_connexion: data.derniere_connexion,
          role: data.type,
        };
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
      }
    );
  }

  ngOnInit(): void {
    this.getUserProfile();
    this.getTaxis();
  }

  openEditPopup(taxi: any): void {
    this.editTaxi = { ...taxi };
    this.isEditPopupOpen = true;
  }

  closeEditPopup(): void {
    this.isEditPopupOpen = false;
  }

  openViewPopup(taxi: any): void {
    this.viewTaxi = taxi;
    this.isViewPopupOpen = true;
  }

  closeViewPopup(): void {
    this.isViewPopupOpen = false;
  }

  // Toggle popup visibility
  togglePopup() {
    this.isPopupVisible = !this.isPopupVisible;
  }

  togglePopup2() {
    this.isPopupVisible2 = !this.isPopupVisible2;
  }

  // Method to handle adding a new taxi
  addTaxi(): void {
    if (!this.newTaxi.nom || !this.newTaxi.matricule || this.newTaxi.prix <= 0) {
      console.error('Tous les champs sont requis et le prix doit être positif.');
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.newTaxi.nom);
    formData.append('matricule', this.newTaxi.matricule);
    formData.append('prix', this.newTaxi.prix.toString());
    if (this.selectedFile) {
      formData.append('photo_de_taxi', this.selectedFile);
    }

    this.taxiservice.addTaxi(formData).subscribe(
      (response) => {
        console.log(response.message);
        this.resetForm();
        this.togglePopup(); // Close the popup after adding taxi
      },
      (error) => {
        console.error('Erreur lors de l’ajout du taxi:', error);
      }
    );
  }

  // Method to reset the form fields
  resetForm(): void {
    this.newTaxi = { nom: '', matricule: '', prix: 0, photo_de_taxi: null };
    this.selectedFile = null;
  }

  // Method to handle file selection for taxi photo
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Open sidebar when mouse enters
  openSidebar(): void {
    this.isSidebarOpen = true;
  }

  // Close sidebar when mouse leaves
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  getTaxis(): void {
    this.taxiservice.getTaxis().subscribe(
      (response) => {
        this.taxis = response;
        console.log('Taxis:', this.taxis);
      },
      (error) => {
        console.error('Erreur lors de la récupération des taxis:', error);
      }
    );
  }

  deleteTaxi(id: number): void {
    this.taxiservice.deleteTaxi(id).subscribe(
      (response) => {
        console.log(response.message);
        this.getTaxis();
      },
      (error) => {
        console.error('Erreur lors de la suppression du taxi:', error);
      }
    );
  }

  updateTaxi(): void {
    if (!this.editTaxi.nom || !this.editTaxi.matricule || this.editTaxi.prix <= 0) {
      console.error('Tous les champs sont requis et le prix doit être positif.');
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.editTaxi.nom);
    formData.append('matricule', this.editTaxi.matricule);
    formData.append('prix', this.editTaxi.prix.toString());
    if (this.selectedFile) {
      formData.append('photo_de_taxi', this.selectedFile);
    }

    this.taxiservice.updateTaxi(this.editTaxi.id, formData).subscribe(
      (response) => {
        console.log(response.message);
        this.getTaxis();
        this.closeEditPopup();
      },
      (error) => {
        console.error('Erreur lors de la mise à jour du taxi:', error);
      }
    );
  }

  // Method to fetch reservations
  showReservations(): void {
    const token = localStorage.getItem('token');

    if (this.user.id && token) {
      this.http
        .get(`http://localhost:3000/api/reservations/admin/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe(
          (data: any) => {
            this.reservations = data.reservations;
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
