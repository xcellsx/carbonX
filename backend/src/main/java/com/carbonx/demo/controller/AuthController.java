package com.carbonx.demo.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity; // <-- Import HttpStatus
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.model.User;
import com.carbonx.demo.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        if (userService.emailExists(user.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Email already registered."));
        }
        // TODO: Hash the password in UserService before saving
        User createdUser = userService.registerUser(user);
        return ResponseEntity.ok(createdUser); // Return user including ID
    }

    // --- NEW ENDPOINT for Login ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Email and password are required."));
        }

        User authenticatedUser = userService.loginUser(email, password);

        if (authenticatedUser != null) {
            // Login successful, return user details (including ID)
            // You might want to return a DTO instead of the full User object
            // for security reasons (e.g., omitting the password).
            // For simplicity, returning the User object here.
            return ResponseEntity.ok(authenticatedUser);
        } else {
            // Login failed
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED) // 401 Unauthorized
                    .body(Map.of("message", "Incorrect email or password"));
        }
    }
    // --- END NEW ENDPOINT ---
}