package com.carbonx.demo.controller;

import com.carbonx.demo.model.User;
import com.carbonx.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

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
        User createdUser = userService.registerUser(user);
        // Optionally check if it's first login and respond accordingly
        return ResponseEntity.ok(createdUser);
    }

    // Later: Add POST /signin endpoint for login logic
}
