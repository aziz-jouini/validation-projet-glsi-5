// chatbot.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  messages: { sender: string; content: string }[] = [];
  userInput: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.messages.push({ sender: 'bot', content: 'Bonjour! Comment puis-je vous aider aujourd\'hui?' });
  }
  sendMessage(): void {
    if (this.userInput.trim()) {
      this.messages.push({ sender: 'user', content: this.userInput });
  
      this.http.post<any>('http://127.0.0.1:5001/chat2', { message: this.userInput }).subscribe(
        (response) => {
          const lines = response.response.split('\n');  // Divise la réponse en lignes
          lines.forEach((line: string) => {  // Déclare explicitement 'line' comme un string
            this.messages.push({ sender: 'bot', content: line });
          });
          this.userInput = '';
        },
        (error) => {
          console.error('Erreur lors de l\'envoi du message au chatbot:', error);
          this.messages.push({ sender: 'bot', content: 'Désolé, il y a eu une erreur.' });
        }
      );
    }
  }
  
  
  
}
