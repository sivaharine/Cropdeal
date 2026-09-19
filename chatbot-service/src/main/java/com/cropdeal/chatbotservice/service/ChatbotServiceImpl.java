package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.client.AuthServiceClient;
import com.cropdeal.chatbotservice.client.CropServiceClient;
import com.cropdeal.chatbotservice.client.DeliveryServiceClient;
import com.cropdeal.chatbotservice.client.OrderServiceClient;
import com.cropdeal.chatbotservice.client.PriceServiceClient;
import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.AuthUserLookupResponse;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.dto.CropPriceResponse;
import com.cropdeal.chatbotservice.dto.CropSearchResponse;
import com.cropdeal.chatbotservice.dto.DeliveryResponse;
import com.cropdeal.chatbotservice.dto.MessageDto;
import com.cropdeal.chatbotservice.dto.OrderResponse;
import com.cropdeal.chatbotservice.dto.PriceSearchRequest;
import com.cropdeal.chatbotservice.dto.ProfileLookupResponse;
import com.cropdeal.chatbotservice.client.UserServiceClient;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ChatbotServiceImpl implements ChatbotService {
    private final ConcurrentMap<String, List<MessageDto>> sessions = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, SessionContext> sessionContexts = new ConcurrentHashMap<>();
    private final SarvamClientService sarvamClientService;
    private final SarvamConfig config;
    private final CropServiceClient cropServiceClient;
    private final PriceServiceClient priceServiceClient;
    private final OrderServiceClient orderServiceClient;
    private final DeliveryServiceClient deliveryServiceClient;
    private final AuthServiceClient authServiceClient;
    private final UserServiceClient userServiceClient;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", Pattern.CASE_INSENSITIVE);
    private static final Pattern GRADE_PATTERN = Pattern.compile("\\b([ABC])\\s*(?:grade)?\\b|\\bgrade\\s*([ABC])\\b", Pattern.CASE_INSENSITIVE);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public ChatbotServiceImpl(SarvamClientService sarvamClientService,
                              SarvamConfig config,
                              CropServiceClient cropServiceClient,
                              PriceServiceClient priceServiceClient,
                              OrderServiceClient orderServiceClient,
                              DeliveryServiceClient deliveryServiceClient,
                              AuthServiceClient authServiceClient,
                              UserServiceClient userServiceClient) {
        this.sarvamClientService = sarvamClientService;
        this.config = config;
        this.cropServiceClient = cropServiceClient;
        this.priceServiceClient = priceServiceClient;
        this.orderServiceClient = orderServiceClient;
        this.deliveryServiceClient = deliveryServiceClient;
        this.authServiceClient = authServiceClient;
        this.userServiceClient = userServiceClient;
    }

    @Override
    public ChatResponse chat(ChatRequest request) {
        String sessionId = StringUtils.hasText(request.sessionId())
                ? request.sessionId()
                : UUID.randomUUID().toString();

        List<MessageDto> history = sessions.computeIfAbsent(sessionId, ignored -> new ArrayList<>());
        SessionContext context = sessionContexts.computeIfAbsent(sessionId, ignored -> new SessionContext());

        String reply;
        synchronized (history) {
            history.add(new MessageDto("user", request.message()));
            trimHistory(history);
            reply = answerFromCropDealServices(request.message(), context)
                    .orElseGet(() -> sarvamClientService.complete(buildMessages(history)));
            history.add(new MessageDto("assistant", reply));
            trimHistory(history);
        }

        return new ChatResponse(sessionId, reply);
    }

    @Override
    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
        sessionContexts.remove(sessionId);
    }

    private Optional<String> answerFromCropDealServices(String message, SessionContext context) {
        String normalized = normalize(message);

        if (isOrderQuestion(normalized) || context.awaitingOrderEmail || extractEmail(message).isPresent()) {
            return Optional.of(answerOrderQuestion(message, context));
        }

        if (isGovernmentPriceQuestion(normalized)) {
            return Optional.of(answerGovernmentPriceQuestion(message));
        }

        if (isCropQuestion(normalized)) {
            return Optional.of(answerCropQuestion(message));
        }

        return Optional.empty();
    }

    private String answerCropQuestion(String message) {
        List<CropSearchResponse> allCrops = cropServiceClient.search(null, null, null, null);
        if (allCrops.isEmpty()) {
            return "I could not find any currently available crops in the CropDeal database.";
        }

        CropFilters filters = inferCropFilters(message, allCrops);
        List<CropSearchResponse> filtered = allCrops.stream()
                .filter(crop -> matches(crop.commodity(), filters.commodity()))
                .filter(crop -> matches(crop.state(), filters.state()))
                .filter(crop -> matches(crop.district(), filters.district()))
                .filter(crop -> matches(crop.grade(), filters.grade()))
                .sorted(Comparator.comparing(CropSearchResponse::commodity, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(CropSearchResponse::state, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(CropSearchResponse::district, String.CASE_INSENSITIVE_ORDER))
                .toList();

        if (filtered.isEmpty()) {
            return "I checked the live CropDeal database, but no available crops matched that query.";
        }

        String heading = filters.isEmpty()
                ? "Available crops in CropDeal:"
                : "Matching available crops from CropDeal:";
        return heading + "\n" + formatCrops(filtered);
    }

    private String answerGovernmentPriceQuestion(String message) {
        List<CropPriceResponse> latestPrices = priceServiceClient.getAllLatestPrices();
        if (latestPrices.isEmpty()) {
            return "I could not fetch daily government market values from price-service right now.";
        }

        PriceFilters filters = inferPriceFilters(message, latestPrices);
        if (filters.hasRequiredLookupFields()) {
            CropPriceResponse lookedUp = priceServiceClient.lookup(
                    new PriceSearchRequest(filters.commodity(), filters.state(), filters.district(), filters.grade()));
            if (lookedUp != null) {
                return "Daily government market value from price-service:\n" + formatPrice(lookedUp);
            }
        }

        List<CropPriceResponse> filtered = latestPrices.stream()
                .filter(price -> matches(price.commodity(), filters.commodity()))
                .filter(price -> matches(price.state(), filters.state()))
                .filter(price -> matches(price.district(), filters.district()))
                .filter(price -> matches(price.grade(), filters.grade()))
                .limit(10)
                .toList();

        if (filtered.isEmpty()) {
            return "I checked price-service, but no government market values matched that query.";
        }

        return "Latest government market values from price-service:\n" + formatPrices(filtered);
    }

    private String answerOrderQuestion(String message, SessionContext context) {
        Optional<String> emailFromMessage = extractEmail(message);
        if (emailFromMessage.isPresent()) {
            context.email = emailFromMessage.get().toLowerCase(Locale.ROOT);
            context.awaitingOrderEmail = false;
        }

        if (!StringUtils.hasText(context.email)) {
            context.awaitingOrderEmail = true;
            return "Please share your registered email id so I can track your order from the order and delivery databases.";
        }

        AuthUserLookupResponse user = authServiceClient.findByEmail(context.email);
        if (user == null) {
            return "I could not find a CropDeal account for " + context.email + ". Please check the email id.";
        }

        ProfileLookupResponse profile = userServiceClient.findProfile(user.id(), user.role());
        if (profile == null) {
            return "I found the account, but no " + user.role().toLowerCase(Locale.ROOT) + " profile is available for " + context.email + ".";
        }

        List<OrderResponse> orders = orderServiceClient.getOrdersForProfile(user.role(), profile.id());
        if (orders.isEmpty()) {
            return "I checked the order database, but there are no orders for " + context.email + ".";
        }

        List<OrderResponse> latestOrders = orders.stream()
                .sorted(Comparator.comparing(OrderResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(5)
                .toList();

        StringBuilder reply = new StringBuilder("Order and delivery tracking for ")
                .append(context.email)
                .append(":\n");
        for (OrderResponse order : latestOrders) {
            DeliveryResponse delivery = deliveryServiceClient.getDeliveryByOrderId(order.id());
            reply.append(formatOrder(order, delivery)).append("\n");
        }
        return reply.toString().trim();
    }

    private CropFilters inferCropFilters(String message, List<CropSearchResponse> crops) {
        String normalized = normalize(message);
        String grade = extractGrade(message).orElse(null);
        String commodity = crops.stream()
                .map(CropSearchResponse::commodity)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        String state = crops.stream()
                .map(CropSearchResponse::state)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        String district = crops.stream()
                .map(CropSearchResponse::district)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        return new CropFilters(commodity, state, district, grade);
    }

    private PriceFilters inferPriceFilters(String message, List<CropPriceResponse> prices) {
        String normalized = normalize(message);
        String grade = extractGrade(message).orElse(null);
        String commodity = prices.stream()
                .map(CropPriceResponse::commodity)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        String state = prices.stream()
                .map(CropPriceResponse::state)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        String district = prices.stream()
                .map(CropPriceResponse::district)
                .filter(Objects::nonNull)
                .distinct()
                .filter(value -> containsTerm(normalized, value))
                .findFirst()
                .orElse(null);
        return new PriceFilters(commodity, state, district, grade);
    }

    private String formatCrops(List<CropSearchResponse> crops) {
        StringBuilder builder = new StringBuilder();
        crops.stream().limit(15).forEach(crop -> builder.append("- ")
                .append(nullSafe(crop.commodity()))
                .append(" | Grade ").append(nullSafe(crop.grade()))
                .append(" | ").append(nullSafe(crop.district())).append(", ").append(nullSafe(crop.state()))
                .append(" | Quantity: ").append(formatNumber(crop.quantity())).append(" ").append(nullSafe(crop.unit()))
                .append(" | Price: Rs.").append(formatNumber(crop.pricePerKg())).append("/kg")
                .append(" | Status: ").append(nullSafe(crop.status()))
                .append("\n"));
        if (crops.size() > 15) {
            builder.append("Showing 15 of ").append(crops.size()).append(" matching crops.");
        }
        return builder.toString().trim();
    }

    private String formatPrices(List<CropPriceResponse> prices) {
        StringBuilder builder = new StringBuilder();
        prices.forEach(price -> builder.append(formatPrice(price)).append("\n"));
        return builder.toString().trim();
    }

    private String formatPrice(CropPriceResponse price) {
        return "- " + nullSafe(price.commodity())
                + " | Grade " + nullSafe(price.grade())
                + " | " + nullSafe(price.district()) + ", " + nullSafe(price.state())
                + " | Date: " + (price.priceDate() == null ? "latest available" : price.priceDate())
                + " | Range: Rs." + formatNumber(price.minPricePerKg()) + " - Rs." + formatNumber(price.maxPricePerKg()) + "/kg";
    }

    private String formatOrder(OrderResponse order, DeliveryResponse delivery) {
        StringBuilder builder = new StringBuilder("- Order #")
                .append(order.id())
                .append(" | ").append(nullSafe(order.cropName()))
                .append(" | Quantity: ").append(order.quantity() == null ? "N/A" : order.quantity())
                .append(" | Order status: ").append(nullSafe(order.status()))
                .append(" | Placed: ").append(order.createdAt() == null ? "N/A" : order.createdAt().format(DATE_TIME_FORMATTER))
                .append(" | Total: Rs.").append(formatNumber(order.totalAmount()));

        if (delivery == null) {
            builder.append(" | Delivery: not created yet");
        } else {
            builder.append(" | Delivery ref: ").append(nullSafe(delivery.deliveryReference()))
                    .append(" | Delivery status: ").append(nullSafe(delivery.status()))
                    .append(" | Tracking: ").append(delivery.startedAt() == null ? "not started" : "started " + delivery.startedAt().format(DATE_TIME_FORMATTER));
            if (delivery.completedAt() != null) {
                builder.append(" | Completed: ").append(delivery.completedAt().format(DATE_TIME_FORMATTER));
            }
        }
        return builder.toString();
    }

    private boolean isCropQuestion(String normalized) {
        return normalized.contains("crop")
                || normalized.contains("vegetable")
                || normalized.contains("available")
                || normalized.contains("quantity")
                || normalized.contains("grade");
    }

    private boolean isGovernmentPriceQuestion(String normalized) {
        return normalized.contains("government")
                || normalized.contains("govt")
                || normalized.contains("mandi")
                || normalized.contains("market value")
                || normalized.contains("daily price")
                || normalized.contains("market price");
    }

    private boolean isOrderQuestion(String normalized) {
        return normalized.contains("order")
                || normalized.contains("track")
                || normalized.contains("tracking")
                || normalized.contains("delivered")
                || normalized.contains("delivery");
    }

    private Optional<String> extractEmail(String message) {
        Matcher matcher = EMAIL_PATTERN.matcher(message);
        if (matcher.find()) {
            return Optional.of(matcher.group());
        }
        return Optional.empty();
    }

    private Optional<String> extractGrade(String message) {
        Matcher matcher = GRADE_PATTERN.matcher(message);
        if (matcher.find()) {
            String grade = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            return Optional.of(grade.toUpperCase(Locale.ROOT));
        }
        return Optional.empty();
    }

    private boolean containsTerm(String normalizedMessage, String value) {
        return StringUtils.hasText(value) && normalizedMessage.contains(normalize(value));
    }

    private boolean matches(String actual, String expected) {
        return !StringUtils.hasText(expected) || (StringUtils.hasText(actual) && actual.equalsIgnoreCase(expected));
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9@.]+", " ").trim();
    }

    private String nullSafe(String value) {
        return StringUtils.hasText(value) ? value : "N/A";
    }

    private String formatNumber(BigDecimal value) {
        return value == null ? "N/A" : value.stripTrailingZeros().toPlainString();
    }

    private String formatNumber(Double value) {
        if (value == null) {
            return "N/A";
        }
        return BigDecimal.valueOf(value).stripTrailingZeros().toPlainString();
    }

    private void trimHistory(List<MessageDto> history) {
        int maxHistoryMessages = Math.max(config.getMaxHistoryMessages(), 2);
        while (history.size() > maxHistoryMessages) {
            history.removeFirst();
        }
    }

    private List<MessageDto> buildMessages(List<MessageDto> history) {
        List<MessageDto> messages = new ArrayList<>();
        if (StringUtils.hasText(config.getSystemPrompt())) {
            messages.add(new MessageDto("system", config.getSystemPrompt()));
        }
        messages.addAll(history);
        return List.copyOf(messages);
    }

    private static class SessionContext {
        private boolean awaitingOrderEmail;
        private String email;
    }

    private record CropFilters(String commodity, String state, String district, String grade) {
        private boolean isEmpty() {
            return !StringUtils.hasText(commodity)
                    && !StringUtils.hasText(state)
                    && !StringUtils.hasText(district)
                    && !StringUtils.hasText(grade);
        }
    }

    private record PriceFilters(String commodity, String state, String district, String grade) {
        private boolean hasRequiredLookupFields() {
            return StringUtils.hasText(commodity)
                    && StringUtils.hasText(state)
                    && StringUtils.hasText(grade);
        }
    }
}
