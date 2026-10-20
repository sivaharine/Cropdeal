package com.example.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:mohantest0002@gmail.com}")
    private String fromEmail;

    public void sendEmail(
            String email,
            String subject,
            String message) {

        log.info("Sending Email to: {}, Subject: {}", email, subject);

        if (mailSender == null) {
            log.warn("JavaMailSender not initialized. Falling back to log-only mode.");
            System.out.println("EMAIL (Simulation)");
            System.out.println("To      : " + email);
            System.out.println("Subject : " + subject);
            System.out.println("Message : " + message);
            return;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(email);
            mailMessage.setSubject(subject);
            mailMessage.setText(message);

            mailSender.send(mailMessage);
            log.info("Email successfully dispatched to {}", email);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", email, ex.getMessage());
        }
    }
}