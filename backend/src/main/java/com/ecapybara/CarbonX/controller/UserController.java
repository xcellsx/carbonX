package com.ecapybara.carbonx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.carbonx.dto.UserDTO;
import com.ecapybara.carbonx.model.User;
import com.ecapybara.carbonx.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * RESTful API Controller for User Management
 * Base URL: /api/users
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Enable CORS for frontend access
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/users
     * Get all users or filter by query parameters
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "active", required = false) Boolean active,
            @RequestParam(name = "company", required = false) String company) {
        
        try {
            List<User> users;
            
            if (role != null && !role.isEmpty()) {
                users = userRepository.findByRole(role);
            } else if (active != null) {
                users = userRepository.findByActive(active);
            } else if (company != null && !company.isEmpty()) {
                users = userRepository.findByCompanyName(company);
            } else {
                users = (List<User>) userRepository.findAll();
            }
            
            // Convert to DTOs (without passwords)
            List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/users/{id}
     * Get a specific user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        try {
            Optional<User> user = userRepository.findById(id);
            
            if (user.isPresent()) {
                return ResponseEntity.ok(convertToDTO(user.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/users/email/{email}
     * Get a user by email
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        try {
            Optional<User> user = userRepository.findByEmail(email);
            
            if (user.isPresent()) {
                return ResponseEntity.ok(convertToDTO(user.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/users/username/{username}
     * Get a user by username
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        try {
            Optional<User> user = userRepository.findByUsername(username);
            
            if (user.isPresent()) {
                return ResponseEntity.ok(convertToDTO(user.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/users
     * Create a new user
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody User user) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Validate required fields
            if (user.getUsername() == null || user.getEmail() == null) {
                response.put("error", "Username and email are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if email already exists
            if (userRepository.existsByEmail(user.getEmail())) {
                response.put("error", "Email already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Check if username already exists
            if (userRepository.existsByUsername(user.getUsername())) {
                response.put("error", "Username already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Set default values
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("user");
            }
            user.setActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            // Save user
            User savedUser = userRepository.save(user);
            
            response.put("message", "User created successfully");
            response.put("user", convertToDTO(savedUser));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * PUT /api/users/{id}
     * Update an existing user
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable String id, 
            @RequestBody User updatedUser) {
        try {
            Map<String, Object> response = new HashMap<>();
            Optional<User> existingUserOpt = userRepository.findById(id);
            
            if (!existingUserOpt.isPresent()) {
                response.put("error", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            User existingUser = existingUserOpt.get();
            
            // Update fields if provided
            if (updatedUser.getUsername() != null) {
                // Check if new username is already taken by another user
                Optional<User> userWithUsername = userRepository.findByUsername(updatedUser.getUsername());
                if (userWithUsername.isPresent() && !userWithUsername.get().getId().equals(id)) {
                    response.put("error", "Username already taken");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
                }
                existingUser.setUsername(updatedUser.getUsername());
            }
            
            if (updatedUser.getEmail() != null) {
                // Check if new email is already taken by another user
                Optional<User> userWithEmail = userRepository.findByEmail(updatedUser.getEmail());
                if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(id)) {
                    response.put("error", "Email already taken");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
                }
                existingUser.setEmail(updatedUser.getEmail());
            }
            
            if (updatedUser.getPassword() != null) {
                existingUser.setPassword(updatedUser.getPassword());
            }
            
            if (updatedUser.getFirstName() != null) {
                existingUser.setFirstName(updatedUser.getFirstName());
            }
            
            if (updatedUser.getLastName() != null) {
                existingUser.setLastName(updatedUser.getLastName());
            }
            
            if (updatedUser.getRole() != null) {
                existingUser.setRole(updatedUser.getRole());
            }
            
            if (updatedUser.getCompanyName() != null) {
                existingUser.setCompanyName(updatedUser.getCompanyName());
            }
            
            existingUser.setActive(updatedUser.isActive());
            existingUser.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(existingUser);
            
            response.put("message", "User updated successfully");
            response.put("user", convertToDTO(savedUser));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * PATCH /api/users/{id}/activate
     * Activate or deactivate a user
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(
            @PathVariable String id,
            @RequestParam(name = "active") boolean active) {
        try {
            Map<String, Object> response = new HashMap<>();
            Optional<User> userOpt = userRepository.findById(id);
            
            if (!userOpt.isPresent()) {
                response.put("error", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setActive(active);
            user.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(user);
            
            response.put("message", active ? "User activated" : "User deactivated");
            response.put("user", convertToDTO(savedUser));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update user status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * DELETE /api/users/{id}
     * Delete a user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        try {
            Map<String, String> response = new HashMap<>();
            
            if (!userRepository.existsById(id)) {
                response.put("error", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            userRepository.deleteById(id);
            response.put("message", "User deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/users/login
     * Simple login endpoint (Note: In production, use proper authentication like JWT)
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        try {
            Map<String, Object> response = new HashMap<>();
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            if (email == null || password == null) {
                response.put("error", "Email and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (!userOpt.isPresent()) {
                response.put("error", "Invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            User user = userOpt.get();
            
            // Simple password check (In production, use proper password hashing like BCrypt)
            if (!user.getPassword().equals(password)) {
                response.put("error", "Invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            if (!user.isActive()) {
                response.put("error", "Account is deactivated");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            response.put("message", "Login successful");
            response.put("user", convertToDTO(user));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Helper method to convert User entity to UserDTO (without password)
     */
    private UserDTO convertToDTO(User user) {
        return new UserDTO(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.getCompanyName(),
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}

