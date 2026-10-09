package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.CropDealDatabaseService.CropRecord;
import com.cropdeal.chatbotservice.service.CropDealDatabaseService.MandiPriceRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class ChatbotAdvisoryService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotAdvisoryService.class);

    private final CropDealDatabaseService dbService;

    public ChatbotAdvisoryService() {
        this.dbService = null;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ChatbotAdvisoryService(CropDealDatabaseService dbService) {
        this.dbService = dbService;
    }

    public ChatResponse processQuery(ChatRequest request) {
        String original = request.getMessage() != null ? request.getMessage().trim() : "";

        if (original.isBlank()) {
            return greetingResponse();
        }

        String msg = original.toLowerCase(Locale.ROOT);

        // ── 0. Mandatory Rule: Unrelated non-agricultural products (shirt, soap, dog, etc.) ──
        if (isUnrelatedProduct(msg)) {
            return unrelatedProductResponse();
        }

        // ── 1. Greetings ──
        if (isGreeting(msg)) return greetingResponse();

        // ── 2. Platform Information (CropDeal overview, Bidding, Negotiation, Price Alerts, Delivery, Pickup, Wallet, etc.) ──
        if (isPlatformInformationQuery(msg)) return handlePlatformInfo(msg);

        // ── 3. Mandi & Market Prices ──
        if (isPriceQuery(msg)) return handleMandiPrice(msg);

        // ── 4. Crops Posted by Farmers ──
        if (isCropQuery(msg)) return handleCropSearch(msg);

        // ── 5. Off-Topic / Out of Scope ──
        return offTopicResponse();
    }

    // =========================================================================
    // 1. GREETING
    // =========================================================================
    private ChatResponse greetingResponse() {
        String answer = "Hey there! 👋 Welcome to **CropDeal**!\n" +
                "I can help you find crops posted by farmers, check live APMC mandi prices, and explore platform features like Live Bidding, Negotiations, Price Alert Dashboard, ₹10/km Delivery, and Free Self Pickup.\n\n" +
                "What can I help you with today?";
        return respond("GREETING", answer,
                List.of("Is tomato present?", "Check Mandi Prices", "Price Alert Dashboard", "What is CropDeal?"));
    }

    // =========================================================================
    // 2. MANDI PRICE (DB + Govt API fallback + Polite Non-Agri Refusal)
    // =========================================================================
    private ChatResponse handleMandiPrice(String msg) {
        String crop = extractCropName(msg);
        String location = extractLocation(msg);

        if (crop != null && dbService != null) {
            // 1. Try local DB first
            List<MandiPriceRecord> records = dbService.findMandiPrices(crop, location, 2);
            if (!records.isEmpty()) {
                MandiPriceRecord r = records.get(0);
                String answer = "📊 **" + title(crop) + " Mandi Rate** — ₹" +
                        (r.modalPricePerKg() != null ? String.format("%.2f", r.modalPricePerKg()) : "N/A") + "/kg" +
                        " (" + (r.market() != null ? r.market() : "Local") + ", " + r.district() + ")\n" +
                        "Daily Range: ₹" + (r.minPricePerKg() != null ? String.format("%.2f", r.minPricePerKg()) : "?") +
                        " – ₹" + (r.maxPricePerKg() != null ? String.format("%.2f", r.maxPricePerKg()) : "?") + "/kg";
                return respond("MANDI_PRICE_DATA", answer,
                        List.of("Is " + title(crop) + " present?", "Price Alert Dashboard", "Check Mandi Prices"));
            }

            // 2. Fallback to Govt price-service API
            CropDealDatabaseService.GovtPriceResult govt = dbService.getGovtPriceFromApi(crop);
            if (govt != null && govt.modalPricePerKg != null) {
                String answer = "📊 **" + title(crop) + " Mandi Rate** (Govt Data) — ₹" +
                        String.format("%.2f", govt.modalPricePerKg) + "/kg" +
                        (govt.market != null ? " (" + govt.market + ", " + govt.district + ")" : "") + "\n" +
                        (govt.minPricePerKg != null ? "Daily Range: ₹" + String.format("%.2f", govt.minPricePerKg) +
                        " – ₹" + String.format("%.2f", govt.maxPricePerKg) + "/kg" : "");
                return respond("MANDI_PRICE_GOVT", answer.trim(),
                        List.of("Is " + title(crop) + " present?", "Price Alert Dashboard", "Check Mandi Prices"));
            }

            // 3. Known agricultural crop but not found in current arrivals
            return respond("MANDI_PRICE_EMPTY",
                    "Sorry, I couldn't find live mandi price records for **" + title(crop) + "** right now. 🙏\n" +
                    "Kindly verify the crop name once — it may not be in today's APMC market arrivals.",
                    List.of("Mandi price of Tomato", "Mandi price of Wheat", "Mandi price of Onion"));
        }

        // crop == null: User did not specify a recognized agricultural crop
        // Check if user is asking for general sample mandi rates (e.g. "Check Mandi Prices")
        if (isGenericMandiOverview(msg) && dbService != null) {
            List<MandiPriceRecord> samples = dbService.getSampleMandiPrices(5);
            if (!samples.isEmpty()) {
                StringBuilder sb = new StringBuilder("📈 **Today's Featured APMC Mandi Rates:**\n");
                for (MandiPriceRecord r : samples) {
                    sb.append("• **").append(r.commodity()).append("**: ₹")
                            .append(r.modalPricePerKg() != null ? String.format("%.2f", r.modalPricePerKg()) : "?")
                            .append("/kg\n");
                }
                sb.append("Ask me for any crop rate (e.g. *\"Mandi price of Tomato\"*)!");
                return respond("MANDI_SAMPLE", sb.toString().trim(),
                        List.of("Mandi price of Tomato", "Mandi price of Wheat", "Mandi price of Onion"));
            }
        }

        // Unrelated or non-agricultural item (e.g. shirt, shoe, phone, etc.)
        return respond("NON_AGRI_PRICE",
                "Sorry, that item is not available in our APMC mandi price records. 🙏\n" +
                "I can only provide live mandi prices for agricultural produce (like Tomato, Wheat, Onion, Cotton, Paddy, etc.).\n" +
                "Kindly verify the crop name once.",
                List.of("Mandi price of Tomato", "Mandi price of Wheat", "Mandi price of Onion"));
    }

    // =========================================================================
    // 3. CROP SEARCH (Crops Posted by Farmers)
    // =========================================================================
    private ChatResponse handleCropSearch(String msg) {
        String crop = extractCropName(msg);
        String location = extractLocation(msg);

        if (crop != null && dbService != null) {
            List<CropRecord> crops = dbService.findCropsByCommodity(crop, location, null);
            if (!crops.isEmpty()) {
                StringBuilder sb = new StringBuilder("✅ **" + title(crop) + "** is available! " + crops.size() + " listing(s):\n");
                for (CropRecord c : crops) {
                    sb.append("• ").append(c.district()).append(", ").append(c.state())
                            .append(" — ").append(c.quantity()).append(" KG @ ₹").append(c.pricePerKg()).append("/kg\n");
                }
                return respond("CROPS_FOUND", sb.toString().trim(),
                        List.of("Mandi price of " + title(crop), "How Negotiation Works", "Show All Crops"));
            } else {
                return respond("CROPS_NOT_FOUND",
                        "No active listings for **" + title(crop) + "** right now. Farmers update listings daily! You can also post a Buying Request on your dashboard.",
                        List.of("Price Alert Dashboard", "Show All Crops", "Check Mandi Prices"));
            }
        }

        // If user is explicitly searching or asking for a specific item (e.g., "is X available", "is X present", "find X")
        // but it's not a recognized crop:
        if (msg.contains("present") || msg.contains("available") || msg.contains("find") || msg.contains("buy") || msg.contains("search") || msg.contains("stock")) {
            return respond("ITEM_NOT_AVAILABLE",
                    "I apologize, but that item is not available on CropDeal. 🙏\n" +
                    "CropDeal specializes exclusively in agricultural produce and APMC mandi commodities.",
                    List.of("Show Available Crops", "Check Mandi Prices", "Price Alert Dashboard"));
        }

        // General overview — list active crops
        if (dbService != null) {
            List<CropRecord> all = dbService.getAllActiveCrops(5);
            if (!all.isEmpty()) {
                StringBuilder sb = new StringBuilder("🌾 **Available crops right now:**\n");
                for (CropRecord c : all) {
                    sb.append("• **").append(c.commodity()).append("** — ").append(c.quantity())
                            .append(" KG @ ₹").append(c.pricePerKg()).append("/kg (").append(c.district()).append(")\n");
                }
                return respond("ALL_CROPS", sb.toString().trim(),
                        List.of("Is tomato present?", "Check Mandi Prices", "Show All Crops"));
            }
        }
        return respond("NO_CROPS", "No crops are currently listed. Check back soon!", List.of());
    }

    // =========================================================================
    // 4. PLATFORM FEATURES & GENERAL INFORMATION
    // =========================================================================
    private ChatResponse handlePlatformInfo(String msg) {
        // ── Price Alert Dashboard & Buying Requests ──
        if (msg.contains("price alert") || msg.contains("alert") || msg.contains("buying request") || msg.contains("dashboard")) {
            String answer = "🔔 **Price Alert Dashboard & Buying Requests:**\n\n" +
                    "• **Custom Price Alerts:** Set target prices for any commodity. Get notified instantly when mandi rates hit your desired threshold!\n" +
                    "• **Dealer Buying Requests:** Post your crop purchase requirements (crop, quantity, target price). Farmers see your request and send direct offers.\n" +
                    "• Open the **Price Alerts** tab on your dashboard to configure alerts in one click!";
            return respond("PRICE_ALERT_GUIDE", answer,
                    List.of("Check Mandi Prices", "Show Available Crops", "How Bidding Works"));
        }

        // ── Self Pickup ──
        if (msg.contains("self pickup") || msg.contains("self-pickup") || msg.contains("pickup")) {
            String answer = "🚜 **Self Pickup (₹0 Free):**\n\n" +
                    "• Dealers can choose **Self Pickup** during checkout to pay **zero delivery fees**.\n" +
                    "• Collect the harvested crop directly from the farmer's farm gate or local mandi yard.\n" +
                    "• Contact details and farm coordinates are shared immediately once the deal is accepted!";
            return respond("SELF_PICKUP_GUIDE", answer,
                    List.of("Delivery Service", "Show Available Crops", "What is CropDeal?"));
        }

        // ── Delivery Service & OTP ──
        if (msg.contains("delivery") || msg.contains("transport") || msg.contains("shipping") || msg.contains("logistics") || msg.contains("otp")) {
            String answer = "🚚 **CropDeal Delivery Service:**\n\n" +
                    "• **CropDeal Express (₹10/km):** Managed door-to-door farm transport handled by verified delivery partners.\n" +
                    "• **Secure 6-Digit OTP:** Handover is strictly authenticated using a delivery OTP sent to your registered phone.\n" +
                    "• **Self Pickup (₹0 Free):** Prefer your own logistics? Collect produce directly from the farm at no charge!";
            return respond("DELIVERY_GUIDE", answer,
                    List.of("Self Pickup", "Show Available Crops", "Check Mandi Prices"));
        }

        // ── Live Bidding / Auctions ──
        if (msg.contains("bid") || msg.contains("auction")) {
            String answer = "🔨 **Live Bidding on CropDeal:**\n\n" +
                    "• Farmers create live crop auctions with a starting reserve price and a countdown timer.\n" +
                    "• Verified dealers place dynamic bids with a minimum increment of **₹1/kg**.\n" +
                    "• When the auction closes, the highest bidder automatically wins the crop lot!\n" +
                    "• Deals are finalized securely through CropDeal Escrow Wallet.";
            return respond("BIDDING_GUIDE", answer,
                    List.of("How Negotiation Works", "Price Alert Dashboard", "Show Available Crops"));
        }

        // ── Direct Negotiation ──
        if (msg.contains("negotiat") || msg.contains("counter")) {
            String answer = "🤝 **Direct Negotiation on CropDeal:**\n\n" +
                    "• Click **Negotiate** on any published crop listing to propose your custom price and quantity.\n" +
                    "• The farmer can **Accept**, **Reject**, or propose a **Counter-Offer** in real time.\n" +
                    "• Once accepted, the transaction confirms at the agreed rate with zero middleman commissions!";
            return respond("NEGOTIATION_GUIDE", answer,
                    List.of("Live Bidding", "Price Alert Dashboard", "Show Available Crops"));
        }

        // ── Wallet & Payments ──
        if (msg.contains("wallet") || msg.contains("payment") || msg.contains("pay") || msg.contains("recharge") || msg.contains("refund") || msg.contains("escrow")) {
            String answer = "💳 **CropDeal Wallet & Escrow Payments:**\n\n" +
                    "• Recharge your wallet instantly via UPI, Net Banking, or Debit/Credit Cards.\n" +
                    "• **Escrow Safety:** Payment is held securely during transit and only released to the farmer after verified OTP delivery.\n" +
                    "• Instant automatic refunds are credited back to your wallet for any cancelled transactions.";
            return respond("WALLET_GUIDE", answer,
                    List.of("Delivery Service", "Show Available Crops", "What is CropDeal?"));
        }

        // ── Invoices & GST ──
        if (msg.contains("invoice") || msg.contains("bill") || msg.contains("receipt") || msg.contains("tax") || msg.contains("gst")) {
            String answer = "📄 **GST Digital Tax Invoices:**\n\n" +
                    "• Automated GST-compliant digital invoices are generated for every completed deal.\n" +
                    "• Invoices include crop lot details, mandi rates, delivery fee breakdown, and digital verification QR codes.\n" +
                    "• Download your PDF tax invoices anytime from your account dashboard!";
            return respond("INVOICE_GUIDE", answer,
                    List.of("Wallet & Payments", "Show Available Crops", "What is CropDeal?"));
        }

        // ── Registration, Roles & Login ──
        if (msg.contains("register") || msg.contains("sign up") || msg.contains("login") || msg.contains("account") || msg.contains("role")) {
            String answer = "📝 **CropDeal Platform Roles:**\n\n" +
                    "• **Farmer:** Post harvest lots, set prices, host live auctions, negotiate directly, and receive escrow payouts.\n" +
                    "• **Dealer:** Browse fresh crops, negotiate prices, participate in live bidding, set price alerts, and request delivery.\n" +
                    "• **Delivery Partner:** Earn competitive payouts delivering agricultural produce at ₹10/km.\n\n" +
                    "Click **Register** in the top navigation to create your free account in under 2 minutes!";
            return respond("REGISTRATION_GUIDE", answer,
                    List.of("Show Available Crops", "Check Mandi Prices", "What is CropDeal?"));
        }

        // ── Reviews & Ratings ──
        if (msg.contains("review") || msg.contains("rating") || msg.contains("feedback")) {
            String answer = "⭐ **Reviews & Trust Rating:**\n\n" +
                    "• Verified dealers and farmers rate each other after every completed deal.\n" +
                    "• Star ratings and honest reviews help you identify top-rated farmers and trusted trading partners across India.";
            return respond("REVIEWS_GUIDE", answer,
                    List.of("Show Available Crops", "What is CropDeal?"));
        }

        // ── General Overview / What is CropDeal ──
        String answer = "🌾 **Welcome to CropDeal — India's Agricultural Marketplace!**\n\n" +
                "Here are the core features available on the platform:\n" +
                "• 🔨 **Live Bidding:** Real-time crop auctions with transparent dealer bidding.\n" +
                "• 🤝 **Direct Negotiation:** Send and receive custom price counter-offers directly.\n" +
                "• 🔔 **Price Alert Dashboard:** Set target mandi prices and post Buying Requests.\n" +
                "• 🚚 **Flexible Logistics:** ₹0 Free Self Pickup or ₹10/km Express Delivery with OTP.\n" +
                "• 💳 **Secure Wallet & GST Invoices:** Safe escrow payments and automated PDF tax invoices.\n\n" +
                "What would you like to explore?";
        return respond("CROPDEAL_OVERVIEW", answer,
                List.of("Show Available Crops", "Check Mandi Prices", "How Bidding Works", "Price Alert Dashboard"));
    }

    // =========================================================================
    // 5. OFF-TOPIC REFUSAL
    // =========================================================================
    private ChatResponse offTopicResponse() {
        String answer = "I'm specifically designed to help with **CropDeal** agricultural services! 😊\n\n" +
                "I can assist you with:\n" +
                "• 🌾 **Crops posted by farmers** (e.g. *\"Is tomato present?\"*)\n" +
                "• 📊 **Live APMC Mandi rates & Price Alerts**\n" +
                "• 🔨 **Live Bidding & Direct Negotiations**\n" +
                "• 🚚 **₹10/km Delivery Logistics & Free Self Pickup**\n" +
                "• 💳 **CropDeal Wallet & GST Invoices**\n\n" +
                "What would you like to know about CropDeal?";
        return respond("OFF_TOPIC", answer,
                List.of("Is tomato present?", "Check Mandi Prices", "Price Alert Dashboard", "What is CropDeal?"));
    }

    // =========================================================================
    // INTENT DETECTION HELPERS
    // =========================================================================
    private boolean isGreeting(String msg) {
        String m = msg.trim();
        return m.matches("^(hi|hello|hey|namaste|vanakkam|good morning|good afternoon|good evening|howdy|sup|greetings|hola|hey there|hi bot|hello bot|hi there|hello there)\\b.*")
                || m.equals("how are you") || m.equals("who are you") || m.equals("what can you do")
                || m.equals("help") || m.equals("start") || m.equals("menu");
    }

    private boolean isPriceQuery(String msg) {
        // Exclude platform queries that mention price/rate in context of features
        if (msg.contains("posted by farmer") || msg.contains("farmer listing") || msg.contains("crops posted")
                || msg.contains("price alert") || msg.contains("alert") || msg.contains("dashboard")
                || msg.contains("negotiat") || msg.contains("bidding") || msg.contains("auction")
                || msg.contains("delivery") || msg.contains("pickup") || msg.contains("wallet")) {
            return false;
        }
        return msg.contains("price") || msg.contains("rate") || msg.contains("mandi")
                || msg.contains("apmc") || msg.contains("market price") || msg.contains("cost")
                || msg.contains("wholesale") || msg.contains("msp");
    }

    private boolean isCropQuery(String msg) {
        if (msg.contains("cropdeal")) {
            return false;
        }
        return msg.matches(".*\\bcrops?\\b.*") || msg.contains("present") || msg.contains("available")
                || msg.contains("find ") || msg.contains("search ") || msg.contains("show ")
                || msg.contains("listing") || msg.contains("buy") || msg.contains("produce")
                || msg.contains("harvest") || extractCropName(msg) != null;
    }

    private boolean isPlatformInformationQuery(String msg) {
        return msg.contains("cropdeal") || msg.contains("website") || msg.contains("platform")
                || msg.contains("feature") || msg.contains("how it work") || msg.contains("how does it work")
                || msg.contains("bidding") || msg.contains("auction") || msg.contains("bid")
                || msg.contains("negotiat") || msg.contains("counter")
                || msg.contains("price alert") || msg.contains("alert") || msg.contains("buying request") || msg.contains("dashboard")
                || msg.contains("delivery") || msg.contains("transport") || msg.contains("shipping") || msg.contains("logistics")
                || msg.contains("self pickup") || msg.contains("pickup")
                || msg.contains("wallet") || msg.contains("payment") || msg.contains("pay") || msg.contains("recharge") || msg.contains("refund") || msg.contains("escrow")
                || msg.contains("invoice") || msg.contains("bill") || msg.contains("receipt") || msg.contains("tax") || msg.contains("gst")
                || msg.contains("register") || msg.contains("sign up") || msg.contains("login") || msg.contains("account") || msg.contains("role")
                || msg.contains("review") || msg.contains("rating") || msg.contains("feedback")
                || msg.contains("dealer") || msg.contains("farmer") || msg.contains("partner") || msg.contains("otp");
    }

    private boolean isGenericMandiOverview(String msg) {
        String m = msg.trim();
        if (m.contains(" of ") || m.matches(".*\\bof\\b.*")) {
            return false;
        }
        return m.equals("mandi prices") || m.equals("mandi price") || m.equals("check mandi prices")
                || m.equals("show mandi prices") || m.equals("today mandi price") || m.equals("today mandi rates")
                || m.equals("market prices") || m.equals("apmc prices") || m.equals("mandi rates")
                || m.matches("^(check|show|view|list|all|today's?|live)?\\s*(mandi|apmc|market)\\s*(rates?|prices?)$")
                || m.matches(".*\\b(all|sample|featured|latest)\\s*(mandi|crop|market)?\\s*(rates?|prices?)\\b.*");
    }

    // =========================================================================
    // ENTITY EXTRACTION HELPERS
    // =========================================================================
    private String extractCropName(String msg) {
        List<String> crops = List.of(
                "tomato", "wheat", "rice", "basmati rice", "basmati", "sharbati wheat", "cotton",
                "onion", "potato", "paddy", "groundnut", "maize", "corn", "red chilli", "green chilli",
                "chilli", "turmeric", "coconut", "sugarcane", "soybean", "mustard", "garlic",
                "ginger", "carrot", "cabbage", "cauliflower", "brinjal", "eggplant", "banana",
                "apple", "mango", "pulses", "gram", "dal", "chana", "moong", "bengal gram"
        );
        for (String c : crops) {
            if (Pattern.compile("\\b" + Pattern.quote(c) + "\\b", Pattern.CASE_INSENSITIVE).matcher(msg).find()) {
                if (c.equals("basmati rice") || c.equals("basmati")) return "rice";
                if (c.equals("sharbati wheat")) return "wheat";
                return c;
            }
        }
        return null;
    }

    private String extractLocation(String msg) {
        List<String> locations = List.of(
                "chennai", "coimbatore", "amritsar", "ludhiana", "erode", "salem", "madurai",
                "dindigul", "namakkal", "pollachi", "punjab", "tamil nadu", "karnataka", "haryana",
                "delhi", "maharashtra", "gujarat", "koyambedu"
        );
        for (String loc : locations) {
            if (Pattern.compile("\\b" + Pattern.quote(loc) + "\\b", Pattern.CASE_INSENSITIVE).matcher(msg).find()) {
                return loc;
            }
        }
        return "";
    }

    private String title(String text) {
        if (text == null || text.isBlank()) return "";
        return text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1);
    }

    public boolean isUnrelatedProduct(String msg) {
        List<String> keywords = List.of(
                "shirt", "shirts", "pant", "pants", "cloth", "clothes", "clothing", "dress", "tshirt", "jeans", "fabric",
                "soap", "soaps", "shampoo", "detergent", "paste", "toothpaste", "brush", "cosmetics", "perfume", "lotion",
                "dog", "dogs", "cat", "cats", "pet", "pets", "puppy", "puppies", "animal", "kitten",
                "phone", "mobile", "laptop", "computer", "tv", "camera", "electronics", "headphone", "earphone",
                "car", "bike", "cycle", "motorcycle", "vehicle", "scooter",
                "shoe", "shoes", "slipper", "watch", "watches", "bag", "bags", "book", "books", "pen", "pencil"
        );
        for (String kw : keywords) {
            if (Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE).matcher(msg).find()) {
                return true;
            }
        }
        return false;
    }

    private ChatResponse unrelatedProductResponse() {
        String answer = "I apologize, but that item is not available on CropDeal. 🙏\n\n" +
                "CropDeal is an agricultural platform exclusively for trading farm produce and APMC mandi commodities (such as Wheat, Tomato, Rice, Cotton, Onion, Potato, etc.).";
        return respond("NON_AGRI_REFUSAL", answer,
                List.of("Check Mandi Prices", "Show Available Crops", "Price Alert Dashboard", "What is CropDeal?"));
    }

    private ChatResponse respond(String intent, String answer, List<String> actions) {
        return ChatResponse.builder()
                .intent(intent)
                .answer(answer)
                .reply(answer)
                .suggestedActions(actions)
                .build();
    }
}
