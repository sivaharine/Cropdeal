package com.example.notification.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendEmail(
            String email,
            String subject,
            String message) {

        /*
         * Add JavaMail/Spring Mail configuration here
         * when actual email sending is required.
         */

        System.out.println("EMAIL");
        System.out.println("To      : " + email);
        System.out.println("Subject : " + subject);
        System.out.println("Message : " + message);
    }
}