// src/main/java/com/carbonx/demo/controller/UserController.java
package com.carbonx.demo.controller;

import com.carbonx.demo.model.CompanyInfo;
import com.carbonx.demo.model.User;
import com.carbonx.demo.repository.CompanyInfoRepository;
import com.carbonx.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        // Find associated company info
        Optional<CompanyInfo> companyInfoOpt = companyInfoRepository.findByUserId(userId);
        String companyName = companyInfoOpt.map(CompanyInfo::getCompanyName).orElse("Company Name"); // Default if not found

        // Create response map
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail()); // Include email if needed
        profile.put("companyName", companyName);

        return ResponseEntity.ok(profile);
    }

    // Optional: Add endpoint to get just the user details if needed elsewhere
    @GetMapping("/{userId}")
     public ResponseEntity<User> getUserById(@PathVariable Long userId) {
         return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
     }
}