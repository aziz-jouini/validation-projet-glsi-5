import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthserviceService } from 'src/app/service/authservice.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  users: any[] = [];

  userr: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'client'
  };
  email = '';
  mot_de_passe = '';
  forgotEmail = '';
  newPassword = '';
  user = {
    prenom: '',
    nom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
    type: 'client'
  };

  isAdminLoggedIn = false;
  isProprietaireLoggedIn = false;
  isClientLoggedIn = false;

  isChatbotVisible: boolean = false; // Etat de visibilité du chatbot

  constructor(private authService: AuthserviceService, private router: Router, private cdRef: ChangeDetectorRef) {
    const userType = localStorage.getItem('userType');
    this.isAdminLoggedIn = userType === 'admin';
  }

  onSubmit() {
    if (this.user.mot_de_passe !== this.user.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    const { confirmPassword, ...userData } = this.user;

    this.authService.register(userData).subscribe(
      response => {
        console.log('Inscription réussie', response);
        alert('Inscription réussie ! Vous pouvez vous connecter maintenant.');
        this.router.navigate(['/']);
      },
      error => {
        console.error('Erreur lors de l\'inscription', error);
        alert('Une erreur est survenue lors de l\'inscription. Détails: ' + error.error.message);
      }
    );
  }

  decodeToken(token: string) {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }

  resetPassword() {
    if (!this.forgotEmail || !this.newPassword) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    const resetData = {
      email: this.forgotEmail,
      newPassword: this.newPassword
    };

    this.authService.resetPassword(resetData).subscribe(
      response => {
        alert('Mot de passe réinitialisé avec succès.');
      },
      error => {
        console.error('Erreur lors de la réinitialisation du mot de passe', error);
        alert('Erreur lors de la réinitialisation du mot de passe.');
      }
    );
  }

  login() {
  const credentials = {
    email: this.email,
    mot_de_passe: this.mot_de_passe
  };

  this.authService.login(credentials).subscribe(
    response => {
      console.log('Connexion réussie', response);
      const token = response.token;

      localStorage.setItem('token', token);
      const decodedToken = this.decodeToken(token);
      const userType = decodedToken.type;
      localStorage.setItem('userType', userType);

      // Set flags based on user type
      this.isAdminLoggedIn = userType === 'admin';
      this.isProprietaireLoggedIn = userType === 'proprietaire';
      this.isClientLoggedIn = userType === 'client';

      // Force refresh of the header by calling detectChanges
      this.cdRef.detectChanges();

      // Redirect based on user type
      if (userType === 'admin') {
        this.router.navigate(['/admin']);
      } else if (userType === 'proprietaire') {
        this.router.navigate(['/proprietaire']);
      } else {
        this.router.navigate(['/client']);
      }
    },
    error => {
      console.error('Erreur lors de la connexion', error);
      alert('Erreur lors de la connexion. Veuillez vérifier vos identifiants.');
    }
  );
}


  logout() {
    // Clear flags and storage
    this.isAdminLoggedIn = false;
    this.isProprietaireLoggedIn = false;
    this.isClientLoggedIn = false;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');

    // Redirect to home page
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    const userType = localStorage.getItem('userType');
    this.isAdminLoggedIn = userType === 'admin';
    this.isProprietaireLoggedIn = userType === 'proprietaire';
    this.isClientLoggedIn = userType === 'client';
    this.getUsers();
    this.authService.getUserProfile().subscribe(
      (data) => {
        this.userr.firstName = data.prenom;
        this.userr.lastName = data.nom;
        this.userr.email = data.email;
        this.userr.type = data.type;
      },
      (error) => {
        console.error('Erreur lors de la récupération des données utilisateur', error);
      }
    );
  }

  profil(): void {
    if (this.userr.password && this.userr.password !== this.userr.confirmPassword) {
      console.error('Les mots de passe ne correspondent pas');
      return;
    }

    const userData = {
      nom: this.userr.lastName,
      prenom: this.userr.firstName,
      email: this.userr.email,
      mot_de_passe: this.userr.password,
      type: this.userr.type
    };

    this.authService.updateUser(userData).subscribe(
      (response) => {
        console.log('Profil mis à jour avec succès', response);
      },
      (error) => {
        console.error('Erreur lors de la mise à jour du profil', error);
      }
    );
  }

  loading = true;

  getUsers(): void {
    this.loading = true;
    this.authService.getUsers().subscribe(
      (data) => {
        this.users = data;
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Erreur lors de la récupération des utilisateurs', error);
        this.loading = false;
      }
    );
  }

  activateUser(userId: string) {
    const userIdAsNumber = Number(userId);

    this.authService.activateUser(userIdAsNumber).subscribe(
      (response) => {
        const userIndex = this.users.findIndex(user => user.id === userIdAsNumber);
        if (userIndex !== -1) {
          this.users[userIndex].active = true;
        }
      },
      (error) => {
        console.error('Erreur lors de l\'activation de l\'utilisateur', error);
      }
    );
  }

  deactivateUser(userId: number): void {
    this.authService.deactivateUser(userId).subscribe(
      (response) => {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.active = false;
        }
      },
      (error) => {
        console.error('Erreur lors de la désactivation de l’utilisateur', error);
      }
    );
  }

  deleteUser(userId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.authService.deleteUser(userId).subscribe(
        (response) => {
          this.users = this.users.filter(u => u.id !== userId);
        },
        (error) => {
          console.error('Erreur lors de la suppression de l’utilisateur', error);
        }
      );
    }
  }

  // Méthode pour basculer l'affichage du chatbot
  toggleChatbot(): void {
    this.isChatbotVisible = !this.isChatbotVisible;
  }

  closeChatbot(): void {
    this.isChatbotVisible = false;
  }
}
