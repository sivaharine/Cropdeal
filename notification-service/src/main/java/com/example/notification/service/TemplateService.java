package com.example.notification.service;

import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    public String generateOtpMessage(
            String otp) {

        return "Your CropDeal delivery OTP is "
                + otp
                + ". Please share this OTP with the delivery agent.";
    }

    public String generateDeliveryCompletedMessage(
            Long orderId) {

        return "Your CropDeal order "
                + orderId
                + " has been delivered successfully.";
    }

    public String generateReturnMessage(
            Long orderId) {

        return "Your return request for order "
                + orderId
                + " has been received.";
    }

    public String generateRefundMessage(
            Long orderId) {

        return "Your refund for order "
                + orderId
                + " has been initiated.";
    }
}