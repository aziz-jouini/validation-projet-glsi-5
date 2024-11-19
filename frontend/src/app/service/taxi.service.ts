import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ObservableInput } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaxiService {
  private url = 'http://localhost:3000/admin';
  private url2 = 'http://localhost:3000/uploads';
  private apiUrl = 'http://127.0.0.1:5000';
  private apiurl = 'http://localhost:3000/auth';
  private url3 = 'http://localhost:3000/api/reservations'
  constructor(private http: HttpClient) { } 
  addTaxi(taxiData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/add`, taxiData, { headers });
  }
  getTaxis(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.url}/list-taxi`, { headers });
  }

  // Nouvelle méthode pour récupérer un taxi par ID
  getTaxiById(taxiId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.url}/taxi/${taxiId}`, { headers });
  }

  // Nouvelle méthode pour mettre à jour un taxi
  updateTaxi(taxiId: number, taxiData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.url}/update/taxi/${taxiId}`, taxiData, { headers });
  }

  // Nouvelle méthode pour supprimer un taxi
  deleteTaxi(taxiId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.url}/delete/taxi/${taxiId}`, { headers });
  }
  sendMessage(message: string): Observable<any> {
    const formData = new FormData();
    formData.append('message', message);
    return this.http.post<any>(`${this.apiUrl}/chat`, formData);
  }

  // Envoyer une image
  sendImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<any>(`${this.apiUrl}/chat`, formData);
  }
  acheterTaxi(proprietaireId: number, taxiId: number): Observable<any> {
    const body = {
      proprietaire_id: proprietaireId,
      taxi_id: taxiId,
    };
    return this.http.post(`${this.apiurl}/acheter-taxi`, body);
  }
  getPurchasedTaxis(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiurl}/mes-taxis`, { headers });
  }
  reserveTaxi(taxiId: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.post(`${this.apiurl}/reserver-taxi`, { taxi_id: taxiId }, { headers });
  }
  
  // Cancel Reservation
  cancelReservation(taxiId: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.post(`${this.apiurl}/annuler-reservation`, { taxi_id: taxiId }, { headers });
  }
  getAvailableTaxis(): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.get<any>(`${this.apiurl}/taxis-disponibles`, { headers });
  }
 
}
