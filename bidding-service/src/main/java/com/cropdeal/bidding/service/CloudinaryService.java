package com.cropdeal.bidding.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enterprise Cloudinary Service for hosting live auction lot imagery and produce pictures.
 * Integrates with Cloudinary REST API with automatic SHA-1 signing and secure HTTPS URL generation.
 */
@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${cloudinary.cloud-name:unkesuzu}")
    private String cloudName;

    @Value("${cloudinary.api-key:463413211136775}")
    private String apiKey;

    @Value("${cloudinary.api-secret:45RiFkxDk8qW68A-wu48g9TxkGk}")
    private String apiSecret;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Upload an image file to Cloudinary under a specific folder.
     * @param file The uploaded MultipartFile
     * @param folder The folder path (e.g., "cropdeal/bidding")
     * @return The secure HTTPS URL of the uploaded image
     */
    public String uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file to Cloudinary");
        }

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                contentType = "image/jpeg";
            }

            String base64Image = Base64.getEncoder().encodeToString(fileBytes);
            String dataUri = "data:" + contentType + ";base64," + base64Image;

            long timestamp = System.currentTimeMillis() / 1000L;

            // Generate SHA-1 signature
            String toSign = (folder != null && !folder.isBlank())
                    ? "folder=" + folder + "&timestamp=" + timestamp + apiSecret
                    : "timestamp=" + timestamp + apiSecret;

            String signature = sha1Hex(toSign);

            StringBuilder body = new StringBuilder();
            body.append("file=").append(URLEncoder.encode(dataUri, StandardCharsets.UTF_8));
            body.append("&api_key=").append(URLEncoder.encode(apiKey, StandardCharsets.UTF_8));
            body.append("&timestamp=").append(timestamp);
            if (folder != null && !folder.isBlank()) {
                body.append("&folder=").append(URLEncoder.encode(folder, StandardCharsets.UTF_8));
            }
            body.append("&signature=").append(signature);

            String uploadUrl = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String respBody = response.body();
                Matcher matcher = Pattern.compile("\"secure_url\"\\s*:\\s*\"([^\"]+)\"").matcher(respBody);
                if (matcher.find()) {
                    String secureUrl = matcher.group(1).replace("\\/", "/");
                    log.info("Cloudinary bidding upload successful! URL: {}", secureUrl);
                    return secureUrl;
                }
            }

            log.error("Cloudinary bidding upload failed with status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Cloudinary upload failed with status " + response.statusCode() + ": " + response.body());

        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Cloudinary upload error: " + e.getMessage(), e);
        }
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
