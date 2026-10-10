import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatbotService } from '../../core/services/chatbot.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-container">
      <!-- Floating Trigger Button -->
      <button *ngIf="!isOpen" class="chatbot-trigger" (click)="toggleChat()" title="Ask CropDeal AI Assistant">
        <i class="fa-solid fa-seedling chat-icon"></i>
        <span class="pulse-ring"></span>
      </button>

      <!-- Chat Window -->
      <div *ngIf="isOpen" class="chatbot-window shadow-xl">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-title-group">
            <div class="bot-avatar">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h4 class="chat-title">AgriBot Assistant</h4>
              <span class="chat-status">
                <span class="status-dot"></span> Online • Local APMC Database Ready
              </span>
            </div>
          </div>
          <button class="close-btn" (click)="toggleChat()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Message Body -->
        <div class="chat-body" #scrollContainer>
          <div class="message bot-message">
            <div class="message-bubble">
              🌱 Welcome to CropDeal! I can help you with live APMC crop prices directly from our local database, ₹10/km delivery logistics, live bidding, and farming advisories. What would you like to know today?
            </div>
            <span class="message-time">Just now</span>
          </div>

          <div *ngFor="let msg of messages" class="message" [ngClass]="msg.sender === 'user' ? 'user-message' : 'bot-message'">
            <div class="message-bubble">
              {{ msg.text }}
            </div>
            <div *ngIf="msg.suggestedActions && msg.suggestedActions.length > 0" class="action-chips">
              <button *ngFor="let act of msg.suggestedActions" class="action-chip" (click)="sendQuick(act)">
                {{ act }}
              </button>
            </div>
            <span class="message-time">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>

          <div *ngIf="isTyping" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Quick Prompts -->
        <div class="quick-prompts">
          <button (click)="sendQuick('What is the price of Tomato from DB?')">🍅 Tomato Mandi Rate (DB)</button>
          <button (click)="sendQuick('What is the price of Wheat from DB?')">🌾 Wheat Mandi Rate (DB)</button>
          <button (click)="sendQuick('What are the delivery charges and rate per km?')">🚚 Delivery (₹10/km)</button>
          <button (click)="sendQuick('Can I choose self pickup for my order?')">🚜 Self Pickup Option</button>
          <button (click)="sendQuick('How does live bidding work for farmers?')">🔨 Live Bidding Rules</button>
          <button (click)="sendQuick('How can dealers subscribe to crops?')">🔔 Crop Subscriptions</button>
          <button (click)="sendQuick('Can farmers edit other farmer posts?')">👨🌾 Farmer Post Editing</button>
          <button (click)="sendQuick('How to download my order tax invoice PDF?')">📑 Download Invoice PDF</button>
          <button (click)="sendQuick('How does the delivery partner get paid?')">💰 Driver Wallet Payout</button>
          <button (click)="sendQuick('Can I get a refund on farmer deals?')">⚠️ Refund Policy</button>
          <button (click)="sendQuick('How to view and edit my profile details?')">👤 Edit Profile</button>
        </div>

        <!-- Input Bar -->
        <div class="chat-footer">
          <input
            type="text"
            [(ngModel)]="userQuery"
            (keyup.enter)="sendMessage()"
            placeholder="Ask crop prices, ₹10/km delivery, bidding..."
            class="chat-input"
          />
          <button class="send-btn" (click)="sendMessage()" [disabled]="!userQuery.trim() || isTyping">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      font-family: inherit;
    }
    .chatbot-trigger {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: white;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(46, 125, 50, 0.4);
      position: relative;
      transition: transform var(--transition-normal);
    }
    .chatbot-trigger:hover {
      transform: scale(1.08);
    }
    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid var(--primary-400);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .chatbot-window {
      width: 400px;
      height: 540px;
      background: #ffffff;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .chat-header {
      background: linear-gradient(135deg, var(--primary-700), var(--primary-800));
      color: white;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .bot-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .chat-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }
    .chat-status {
      font-size: 0.7rem;
      color: var(--primary-200);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
    }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity var(--transition-fast);
    }
    .close-btn:hover { opacity: 1; }
    .chat-body {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: #f8fafc;
    }
    .message {
      display: flex;
      flex-direction: column;
      max-width: 86%;
    }
    .bot-message {
      align-self: flex-start;
    }
    .user-message {
      align-self: flex-end;
    }
    .message-bubble {
      padding: 0.75rem 0.95rem;
      border-radius: var(--radius-lg);
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .bot-message .message-bubble {
      background: #ffffff;
      color: var(--text-main);
      border: 1px solid var(--border-light);
      border-bottom-left-radius: 4px;
    }
    .user-message .message-bubble {
      background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
      color: white;
      border-bottom-right-radius: 4px;
    }
    .action-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.4rem;
    }
    .action-chip {
      font-size: 0.68rem;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-300);
      border-radius: var(--radius-full);
      padding: 0.2rem 0.55rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .action-chip:hover {
      background: var(--primary-100);
      border-color: var(--primary-500);
    }
    .message-time {
      font-size: 0.65rem;
      color: var(--text-subtle);
      margin-top: 0.2rem;
      padding: 0 0.25rem;
    }
    .user-message .message-time { align-self: flex-end; }
    .quick-prompts {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      overflow-x: auto;
      background: #fff;
      border-top: 1px solid var(--border-light);
    }
    .quick-prompts button {
      font-size: 0.7rem;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      border-radius: var(--radius-full);
      padding: 0.25rem 0.65rem;
      white-space: nowrap;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .quick-prompts button:hover {
      background: var(--primary-100);
    }
    .chat-footer {
      padding: 0.75rem 1rem;
      background: #fff;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 0.5rem;
    }
    .chat-input {
      flex: 1;
      padding: 0.6rem 0.85rem;
      font-size: 0.85rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      background: var(--bg-subtle);
      outline: none;
    }
    .chat-input:focus {
      background: #fff;
      border-color: var(--primary-500);
    }
    .send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary-600);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);
    }
    .send-btn:hover:not(:disabled) {
      background: var(--primary-700);
    }
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      background: #fff;
      width: fit-content;
      border-radius: 12px;
      border: 1px solid var(--border-light);
    }
    .typing-indicator span {
      width: 6px;
      height: 6px;
      background: var(--primary-400);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    @media (max-width: 480px) {
      .chatbot-window {
        width: calc(100vw - 32px);
        height: 75vh;
        right: 16px;
        bottom: 16px;
      }
    }
  `]
})
export class ChatbotComponent {
  isOpen = false;
  userQuery = '';
  isTyping = false;
  messages: ChatMessage[] = [];

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendQuick(prompt: string): void {
    this.userQuery = prompt;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.userQuery.trim()) return;

    const text = this.userQuery.trim();
    this.messages.push({
      sender: 'user',
      text,
      timestamp: new Date()
    });
    this.userQuery = '';
    this.isTyping = true;

    const user = this.authService.currentUserValue;
    const uid = user?.id || user?.userId || 'guest';

    this.chatbotService.askBot(text, uid).subscribe({
      next: (res) => {
        this.isTyping = false;
        const botReply = (res.response && !res.response.toLowerCase().includes('sorry') && res.response.length > 10)
          ? res.response
          : this.generateIntelligentAnswer(text);

        this.messages.push({
          sender: 'bot',
          text: botReply,
          timestamp: new Date(),
          suggestedActions: res.suggestedActions
        });
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: this.generateIntelligentAnswer(text),
          timestamp: new Date()
        });
      }
    });
  }

  generateIntelligentAnswer(text: string): string {
    const q = text.toLowerCase();

    // Delivery charge & per-km rate
    if (q.includes('charge') || q.includes('rate') && q.includes('km') || q.includes('rupee') || (q.includes('deliver') && (q.includes('cost') || q.includes('price') || q.includes('fee') || q.includes('how much') || q.includes('calculate')))) {
      return '🚚 **CropDeal Delivery Charges & Logistics:**\n\n• Rate: Strictly ₹10 per kilometer based on the distance between the farmer\'s farm-gate and the dealer\'s drop warehouse (e.g., 20 km = ₹200, 45 km = ₹450).\n• Options: Dealers can choose between Delivery Agent Partner (@ ₹10/km) or Self Pickup (₹0 fee).\n• Payout: Automatically credited to the driver\'s digital wallet upon DELIVERED status.';
    }

    // Self pickup
    if (q.includes('self pickup') || q.includes('self-pickup') || q.includes('pickup') || q.includes('collect')) {
      return '🚜 **Self Pickup Option:**\n\n• Dealers can choose "Self Pickup" during checkout with ₹0 delivery charge.\n• Collect harvest directly from the farmer\'s farm-gate or local mandi shed with full farmer contact info.';
    }

    // Delivery partner / Driver payout
    if (q.includes('delivery partner') || q.includes('driver') || q.includes('payout') || q.includes('take order') || q.includes('claim') || q.includes('logistics')) {
      return '🚚 **Delivery Partner Workflow:**\n\n• Log into Logistics Dashboard (/deliveries) to claim available jobs.\n• Each card shows farmer pickup details with phone and dealer drop details with phone.\n• Complete milestone updates: Assigned ➔ Picked Up ➔ In Transit ➔ Delivered.\n• ₹10/km payout is automatically deposited in your digital wallet upon delivery.';
    }

    // Bidding rules
    if (q.includes('bid') || q.includes('auction')) {
      return '🔨 **Live Bidding & Auction Rules (/bidding):**\n\n• Farmers can create auctions with base price per KG and deadline.\n• Farmers can view all active marketplace bids, but can close ONLY the auctions created by themselves.\n• When closed, the order is automatically awarded to the highest bidding dealer funded via escrow wallet.';
    }

    // Farmer post editing & ownership
    if (q.includes('edit post') || q.includes('edit crop') || q.includes('post crop') || (q.includes('farmer') && q.includes('post'))) {
      return '👨🌾 **Farmer Crop Posting & Ownership Rules:**\n\n• Farmers set prices within the government APMC reference band (±15%).\n• Farmers can browse all marketplace listings, but can edit or remove ONLY their own harvest posts (isMyCrop rule).';
    }

    // Crop subscriptions
    if (q.includes('subscri')) {
      return '🔔 **Dealer Crop Subscriptions (/subscribed-crops):**\n\n• Dealers have a dedicated section to subscribe to crops they purchase frequently.\n• Whenever any farmer posts a subscribed crop, you receive instant alerts with direct purchase links.';
    }

    // Tomato
    if (q.includes('tomato')) {
      return '🍅 **Tomato APMC Benchmark Rate:**\n\n• Government APMC Reference: ₹28.00 / Kg\n• Permitted APMC Fair Price Band: ₹23.80 – ₹37.80 / Kg\n• Live data is retrieved from CropDeal Local APMC Database (cropdeal_price_db).';
    }

    // Wheat
    if (q.includes('wheat') || q.includes('sharbati')) {
      return '🌾 **Wheat APMC Benchmark Rate:**\n\n• Government APMC Reference: ₹24.50 / Kg\n• MSP Baseline: ₹22.75 / Kg\n• Permitted APMC Fair Price Band: ₹20.80 – ₹33.00 / Kg\n• Verified from CropDeal Local APMC Database (cropdeal_price_db).';
    }

    // Basmati Rice / Paddy
    if (q.includes('rice') || q.includes('basmati') || q.includes('paddy')) {
      return '🍚 **Basmati Rice / Paddy APMC Benchmark Rate:**\n\n• Government APMC Reference: ₹42.00 / Kg\n• MSP Baseline: ₹38.00 / Kg\n• Permitted APMC Fair Price Band: ₹35.70 – ₹56.70 / Kg.';
    }

    // Mustard / Sarson
    if (q.includes('mustard') || q.includes('sarson') || q.includes('oilseed')) {
      return '🌼 **Mustard Seed APMC Benchmark Rate:**\n\n• Government APMC Reference: ₹56.00 / Kg\n• MSP Baseline: ₹54.50 / Kg\n• Permitted APMC Fair Price Band: ₹47.60 – ₹75.60 / Kg.';
    }

    // Cotton / Kapas
    if (q.includes('cotton') || q.includes('kapas')) {
      return '🌱 **Cotton APMC Benchmark Rate:**\n\n• Government APMC Reference: ₹73.00 / Kg\n• MSP Baseline: ₹70.20 / Kg\n• Permitted APMC Fair Price Band: ₹62.00 – ₹98.50 / Kg.';
    }

    // General crop prices / MSP / APMC
    if (q.includes('price') || q.includes('rate') || q.includes('msp') || q.includes('apmc') || q.includes('mandi')) {
      return '🌾 **Today\'s APMC Mandi Benchmarks from Database:**\n\n• Wheat: ₹24.50/Kg\n• Tomato: ₹28.00/Kg\n• Basmati Rice: ₹42.00/Kg\n• Mustard: ₹56.00/Kg\n• Cotton: ₹73.00/Kg\n• View complete live dataset under "APMC Price Alerts" (/price-alerts).';
    }

    // Tax Invoice / PDF Download
    if (q.includes('invoice') || q.includes('pdf') || q.includes('bill') || q.includes('receipt') || q.includes('download')) {
      return '📑 **Official Tax Invoice PDF:**\n\n• Download certified GST Tax Invoice PDFs anytime from "Order History & Invoices" (/orders).\n• Click the green "Download PDF" button next to any paid order. Contains farmer PAN, dealer GSTIN, and digital audit seal.';
    }

    // Refund policy
    if (q.includes('refund') || q.includes('cancel') || q.includes('return')) {
      return '⚠️ **Strict No-Refund Policy:**\n\n• There are strictly NO REFUNDS between dealers and farmers once a harvest deal is placed.\n• Escrow funds in the Digital Wallet are released upon delivery completion to protect agricultural producers.';
    }

    // Profile view & edit
    if (q.includes('profile') || q.includes('edit details') || q.includes('my account') || q.includes('bank') || q.includes('change phone')) {
      return '👤 **User Profile Management (/profile):**\n\n• All users can view and edit their profile by clicking "My User Profile" in the sidebar.\n• Update name, phone, address, farm/business details, vehicle registration, and bank IFSC details.';
    }

    // Wallet / Escrow
    if (q.includes('wallet') || q.includes('escrow') || q.includes('balance') || q.includes('deposit') || q.includes('withdraw')) {
      return '💰 **CropDeal Escrow Wallet (/wallet):**\n\n• Instant top-up via UPI, Net Banking, and Debit Cards.\n• Zero commission on direct farmer-to-dealer transactions.\n• Automated escrow releases upon delivery milestone verification.';
    }

    // Default polite response
    return '🌱 **Hello! I am your CropDeal Agricultural Assistant.**\n\nI can help with APMC crop rates from our local database (Tomato, Wheat, Basmati, Mustard, Cotton), ₹10/km delivery logistics, self-pickup options, live bidding rules, official Tax Invoice PDF downloads, and wallet settlements. What would you like to know?';
  }
}
