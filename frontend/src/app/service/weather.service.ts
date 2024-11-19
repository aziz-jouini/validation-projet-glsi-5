import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = 'daeec2b98eb748b2be7171255242610'; // Remplacez par votre clé API WeatherAPI
  private baseUrl = 'https://api.weatherapi.com/v1/current.json';

  constructor(private http: HttpClient) {}

  getWeather(lat: number, lng: number): Observable<any> {
    const url = `${this.baseUrl}?key=${this.apiKey}&q=${lat},${lng}`;
    return this.http.get(url);
  }
}
