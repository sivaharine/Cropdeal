package com.example.notification.service;

import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    public String generateOtpMessage(String otp) {
        return "Your CropDeal delivery OTP is " + otp + ". Please share this OTP with the delivery agent.";
    }

    public String generateDeliveryCompletedMessage(Long orderId) {
        return "Your CropDeal order " + orderId + " has been delivered successfully.";
    }

    public String generateReviewCreatedMessage(Long farmerId, Long orderId) {
        return "Farmer #" + farmerId + ", you have received a new review for order #" + orderId + ".";
    }
}