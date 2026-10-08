package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class ChatbotAdvisoryService {
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatbotAdvisoryService() {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(8));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @Value("${cropdeal.price-service.url:http://price-service:8084}")
    private String priceServiceUrl;

    @Value("${cropdeal.crop-service.url:http://crop-service:8083}")
    private String cropServiceUrl;

    public ChatResponse processQuery(ChatRequest request) {
        String original = request.getMessage().trim();
        String message = original.toLowerCase(Locale.ROOT);
        String crop = extractCropName(message);

        if (isPrivateDataQuestion(message)) {
            return response(original, "PRIVATE_DATA_UNAVAILABLE",
                    "I can’t access personal orders, negotiations, bids, wallet balances, deliveries, or admin records from this chat. Open the relevant CropDeal page to view information protected by your account.",
                    List.of("My Orders", "My Wallet", "My Negotiations"));
        }
        if (isPriceQuery(message)) {
            if (crop == null) {
                return response(original, "PRICE_CLARIFICATION",
                        "Which crop should I check? Mandi records are available by commodity. You can also open Mandi Prices to browse current records.",
                        List.of("Mandi Prices"));
            }
            return priceAnswer(original, crop);
        }
        if (isCropSearch(message)) {
            if (crop == null) {
                return response(original, "CROP_CLARIFICATION",
                        "Which crop are you looking for? I can search public CropDeal listings.",
                        List.of("Search Crops"));
            }
            return cropAnswer(original, crop);
        }
        if (message.contains("what is cropdeal") || message.contains("how does cropdeal work")) {
            return response(original, "CROPDEAL_GUIDE",
                    "CropDeal is an agricultural marketplace where farmers publish crop listings and buyers can discover them, negotiate, or participate in live auctions. Public crop listings and mandi records can be browsed without signing in. An account is required for personal marketplace activity.",
                    List.of("Search Crops", "Mandi Prices", "Live Bidding", "Register"));
        }
        if (message.contains("register") || message.contains("sign up") || message.contains("become a farmer") || message.contains("become a dealer")) {
            return response(original, "REGISTRATION_GUIDE",
                    "Create an account from Register and choose the role that matches how you use CropDeal. Sign in to access role-specific pages.",
                    List.of("Register", "Login"));
        }
        if (message.contains("buy") || message.contains("purchase") || message.contains("sell") || message.contains("negotiat") || message.contains("bidding") || message.contains("auction")) {
            return response(original, "MARKETPLACE_GUIDE",
                    "Browse public crop listings, review available listing details, and sign in to use buying, negotiation, or bidding features available to your account.",
                    List.of("Search Crops", "Mandi Prices", "Live Bidding", "Login"));
        }
        if (isAgronomyQuery(message)) {
            return response(original, "AGRONOMY_GUIDANCE",
                    "I can help with general crop growing topics, but this assistant does not connect to a verified agronomy advisory source. For crop-specific treatment or pesticide instructions, consult a qualified local agricultural extension professional.",
                    List.of("Mandi Prices", "Search Crops"));
        }
        return response(original, "GENERAL_ASSIST",
                "I can help explain CropDeal, search public crop listings, and look up recorded mandi prices. I cannot retrieve private account data from this chat.",
                List.of("What is CropDeal?", "Search Crops", "Mandi Prices", "Live Bidding", "Login Help"));
    }

    private ChatResponse priceAnswer(String query, String crop) {
        try {
            String json = restClient.get()
                    .uri(priceServiceUrl + "/api/v1/prices/mandi-rates?commodity={commodity}", crop)
                    .retrieve().body(String.class);
            JsonNode root = objectMapper.readTree(json == null ? "[]" : json);
            if (!root.isArray() || root.isEmpty()) {
                return response(query, "PRICE_DATA_EMPTY",
                        "I couldn’t find mandi price records for " + title(crop) + ". Please try another commodity or check the Mandi Prices page.",
                        List.of("Mandi Prices"));
            }
            List<JsonNode> records = new ArrayList<>();
            root.forEach(records::add);
            records.sort(Comparator.comparing((JsonNode n) -> n.path("recordDate").asText(""), Comparator.reverseOrder()));
            String location = requestedLocation(query);
            if (!location.isBlank()) {
                records.removeIf(record -> !record.path("district").asText("").toLowerCase(Locale.ROOT).contains(location)
                        && !record.path("market").asText("").toLowerCase(Locale.ROOT).contains(location));
                if (records.isEmpty()) {
                    return response(query, "PRICE_LOCATION_EMPTY",
                            "I couldn’t find " + title(crop) + " mandi records for " + title(location) + ". Check the location spelling or browse the Mandi Prices page.",
                            List.of("Mandi Prices"));
                }
            }
            StringBuilder answer = new StringBuilder("Mandi records for ").append(title(crop)).append(" (latest records returned by Price Service):");
            records.stream().limit(5).forEach(record -> {
                String price = value(record, "convertedPricePerKg");
                String unit = price.equals("—") ? value(record, "modalPrice") + " per " + value(record, "sourceUnit") : "₹" + price + "/kg";
                answer.append("\n• ").append(value(record, "market")).append(", ")
                        .append(value(record, "district")).append(", ").append(value(record, "state"))
                        .append(": modal ").append(unit).append(" (").append(value(record, "recordDate")).append(")");
            });
            return response(query, "LIVE_MANDI_RECORDS", answer.toString(), List.of("Mandi Prices", "Search Crops"));
        } catch (Exception ex) {
            log.warn("Mandi lookup unavailable for {}: {}", crop, ex.getMessage());
            return response(query, "PRICE_SERVICE_UNAVAILABLE",
                    "I couldn’t retrieve mandi records right now. Please try again or open the Mandi Prices page.",
                    List.of("Mandi Prices"));
        }
    }

    private ChatResponse cropAnswer(String query, String crop) {
        try {
            String json = restClient.get()
                    .uri(cropServiceUrl + "/api/v1/crops/search?cropName={crop}&page=0&size=5", crop)
                    .retrieve().body(String.class);
            JsonNode root = objectMapper.readTree(json == null ? "{}" : json);
            JsonNode content = root.isArray() ? root : root.path("content");
            if (!content.isArray() || content.isEmpty()) {
                return response(query, "CROP_LISTINGS_EMPTY",
                        "There are no public " + title(crop) + " listings in the search results right now. You can try another crop or browse the marketplace.",
                        List.of("Search Crops"));
            }
            StringBuilder answer = new StringBuilder("Public ").append(title(crop)).append(" listings:");
            content.forEach(item -> answer.append("\n• ")
                    .append(value(item, "cropName"))
                    .append(" — ₹").append(value(item, "pricePerKg")).append("/kg, ")
                    .append(value(item, "availableQuantityKg")).append(" kg available, ")
                    .append(value(item, "district")).append(", ").append(value(item, "state")));
            return response(query, "PUBLIC_CROP_LISTINGS", answer.toString(), List.of("Search Crops", "Mandi Prices"));
        } catch (Exception ex) {
            log.warn("Crop listing lookup unavailable for {}: {}", crop, ex.getMessage());
            return response(query, "CROP_SERVICE_UNAVAILABLE",
                    "I couldn’t retrieve crop listings right now. Please try again or open Search Crops.",
                    List.of("Search Crops"));
        }
    }

    private ChatResponse response(String query, String intent, String answer, List<String> actions) {
        return ChatResponse.builder().query(query).intent(intent).answer(answer)
                .suggestedActions(actions).build();
    }

    private boolean isPriceQuery(String message) {
        return message.contains("price") || message.contains("rate") || message.contains("mandi")
                || message.contains("market value") || message.contains("msp");
    }

    private boolean isCropSearch(String message) {
        return message.contains("find ") || message.contains("search ") || message.contains("available ")
                || message.contains("listings") || message.contains("browse crops") || message.contains("show crops");
    }

    private boolean isAgronomyQuery(String message) {
        return message.contains("fertilizer") || message.contains("pest") || message.contains("disease")
                || message.contains("blight") || message.contains("spray") || message.contains("fungus")
                || message.contains("insects") || message.contains("harvest") || message.contains("yield")
                || message.contains("soil") || message.contains("irrigation");
    }

    private boolean isPrivateDataQuestion(String message) {
        return message.contains("my ") || message.contains("my\'") || message.contains("order #")
                || message.contains("wallet") || message.contains("balance") || message.contains("negotiation")
                || message.contains("my bid") || message.contains("delivery status")
                || message.contains("how many users") || message.contains("recent payments")
                || message.contains("audit log") || message.contains("admin report");
    }

    private String extractCropName(String message) {
        for (String crop : List.of("tomato", "onion", "potato", "wheat", "rice", "paddy", "cotton",
                "banana", "apple", "mango", "chilli", "garlic", "ginger", "carrot", "cabbage",
                "cauliflower", "brinjal", "sugarcane", "soybean", "groundnut", "mustard",
                "turmeric", "pulses", "maize", "corn")) {
            if (java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(crop) + "\\b")
                    .matcher(message).find()) return crop;
        }
        return null;
    }

    private String title(String text) {
        return text.isEmpty() ? text : text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1);
    }

    private String requestedLocation(String query) {
        String lower = query.toLowerCase(Locale.ROOT);
        int inAt = lower.lastIndexOf(" in ");
        if (inAt < 0) return "";
        return lower.substring(inAt + 4).replaceAll("[^a-z\\s-].*$", "").trim();
    }

    private String value(JsonNode node, String key) {
        JsonNode value = node.get(key);
        return value == null || value.isNull() || value.asText().isBlank() ? "—" : value.asText();
    }
}
