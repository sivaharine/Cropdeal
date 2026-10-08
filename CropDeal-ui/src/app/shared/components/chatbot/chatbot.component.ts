import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { AuthService } from '../../../core/services/auth.service';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: Message[] = [
    {
      sender: 'bot',
      text: 'Namaste! Welcome to CropDeal AI Assistant. Ask me about live mandi prices, auction bidding, placing orders, or escrow payments.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  suggestedQuestions = [
    'Today Mandi Price?',
    'How does Bidding work?',
    'Track my Order',
    'Wallet Escrow Safety'
  ];

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  send(query?: string): void {
    const text = query || this.userInput.trim();
    if (!text) return;

    this.messages.push({
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.userInput = '';
    this.isTyping = true;

    const userId = this.authService.currentUser?.userId;
    this.chatbotService.sendMessage(text, userId).subscribe({
      next: res => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: 'I am here to assist with crops, live mandi pricing, and CropDeal orders. Please let me know how I can help!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });
  }

  clearChat(): void {
    this.chatbotService.clearSession().subscribe(() => {
      this.messages = [
        {
          sender: 'bot',
          text: 'Chat history cleared. How can I assist you with your agricultural trading today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    });
  }
}
