import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {
  private url = 'http://localhost:3000/admin';
  private apiUrl = 'http://localhost:3000/auth';
  constructor(private http: HttpClient) {}
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // Méthode pour le login
  login(credentials: { email: string, mot_de_passe: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  resetPassword(data: { email: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }
  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/me`, { headers });
  }

  updateUser(user: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/update`, user, { headers });
  }
  getUsers(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.url}/users`, { headers });
  }

  activateUser(userId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/activate`, { userId }, { headers });
  }

  // Nouvelle méthode pour désactiver un utilisateur
  deactivateUser(userId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/deactivate`, { userId }, { headers });
  }

  // Nouvelle méthode pour supprimer un utilisateur
  deleteUser(userId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.url}/delete/${userId}`, { headers });
  }
  acheterTaxi(proprietaireId: number, taxiId: number): Observable<any> {
    const body = {
      proprietaire_id: proprietaireId,
      taxi_id: taxiId,
    };
    return this.http.post(`${this.apiUrl}/acheter-taxi`, body);
  }
}
