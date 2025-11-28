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
import java.util.Map;
import java.util.Optional;

/**
 * RESTful API Controller for Authentication
 * Base URL: /api/auth
 * 
 * This controller handles all authentication-related operations including:
 * - User registration
 * - User login
 * - User logout
 * - Password management
 * - Session/token management
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Enable CORS for frontend access
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/auth/register
     * Register a new user account
     * 
     * This is an alias for creating a new user, but specifically for registration flow.
     * It enforces stronger validation and sets appropriate defaults for new users.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody User user) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Validate required fields
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                response.put("error", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                response.put("error", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                response.put("error", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate password strength (basic validation)
            if (user.getPassword().length() < 6) {
                response.put("error", "Password must be at least 6 characters long");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if email already exists
            if (userRepository.existsByEmail(user.getEmail())) {
                response.put("error", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Check if username already exists
            if (userRepository.existsByUsername(user.getUsername())) {
                response.put("error", "Username already taken");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Set default values for new registration
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("user"); // Default role for new registrations
            }
            user.setActive(true); // New users are active by default
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            // Save user (Note: In production, hash the password before saving)
            User savedUser = userRepository.save(user);
            
            response.put("message", "Registration successful");
            response.put("user", convertToDTO(savedUser));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/login
     * Authenticate user with email/username and password
     * 
     * Supports login with either email or username.
     * Returns user information on successful authentication.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        try {
            Map<String, Object> response = new HashMap<>();
            String identifier = credentials.get("email"); // Can be email or username
            String username = credentials.get("username");
            String password = credentials.get("password");
            
            // Validate input
            if ((identifier == null && username == null) || password == null) {
                response.put("error", "Email/username and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Try to find user by email or username
            Optional<User> userOpt = Optional.empty();
            if (identifier != null && !identifier.isEmpty()) {
                // Try email first
                userOpt = userRepository.findByEmail(identifier);
                // If not found by email, try username
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findByUsername(identifier);
                }
            } else if (username != null && !username.isEmpty()) {
                userOpt = userRepository.findByUsername(username);
            }
            
            if (!userOpt.isPresent()) {
                response.put("error", "Invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            User user = userOpt.get();
            
            // Check password (In production, use proper password hashing like BCrypt)
            if (!user.getPassword().equals(password)) {
                response.put("error", "Invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            // Check if account is active
            if (!user.isActive()) {
                response.put("error", "Account is deactivated. Please contact administrator.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // Successful login
            response.put("message", "Login successful");
            response.put("user", convertToDTO(user));
            response.put("authenticated", true);
            
            // In production, generate and return JWT token here
            // response.put("token", generateJwtToken(user));
            // response.put("expiresIn", 3600); // Token expiry in seconds
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/logout
     * Logout current user
     * 
     * In a stateless JWT implementation, this would invalidate the token.
     * For session-based auth, this would clear the session.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // In production with JWT:
            // - Add token to blacklist
            // - Clear any server-side session data
            
            // In production with sessions:
            // - Invalidate the session
            
            response.put("message", "Logout successful");
            response.put("authenticated", false);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Logout failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user's information
     * 
     * Returns the user information for the currently authenticated user.
     * Requires authentication token in production.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // In production, extract userId from JWT token
            // String userId = extractUserIdFromToken(token);
            
            if (userId == null || userId.isEmpty()) {
                response.put("error", "User ID is required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (!userOpt.isPresent()) {
                response.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            User user = userOpt.get();
            
            if (!user.isActive()) {
                response.put("error", "Account is deactivated");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            response.put("user", convertToDTO(user));
            response.put("authenticated", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get user information: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/change-password
     * Change password for authenticated user
     * 
     * Requires current password for verification.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> passwordData) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            String userId = passwordData.get("userId");
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            // Validate input
            if (userId == null || currentPassword == null || newPassword == null) {
                response.put("error", "User ID, current password, and new password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (newPassword.length() < 6) {
                response.put("error", "New password must be at least 6 characters long");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            User user = userOpt.get();
            
            // Verify current password
            if (!user.getPassword().equals(currentPassword)) {
                response.put("error", "Current password is incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            // Update password (In production, hash the password)
            user.setPassword(newPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            response.put("message", "Password changed successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to change password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Request password reset
     * 
     * Sends a password reset token/link to the user's email.
     * In production, this would generate a secure token and send an email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            Map<String, Object> response = new HashMap<>();
            String email = request.get("email");
            
            if (email == null || email.isEmpty()) {
                response.put("error", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            // Security: Always return success even if email doesn't exist
            // This prevents user enumeration attacks
            if (!userOpt.isPresent()) {
                response.put("message", "If the email exists, a password reset link has been sent");
                return ResponseEntity.ok(response);
            }
            
            // In production:
            // 1. Generate secure reset token
            // 2. Store token with expiry in database
            // 3. Send email with reset link containing token
            // String resetToken = generateSecureToken();
            // sendPasswordResetEmail(user.getEmail(), resetToken);
            
            response.put("message", "If the email exists, a password reset link has been sent");
            response.put("note", "Production implementation would send email");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to process password reset request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using reset token
     * 
     * Validates the reset token and updates the password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            
            if (token == null || newPassword == null) {
                response.put("error", "Reset token and new password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (newPassword.length() < 6) {
                response.put("error", "Password must be at least 6 characters long");
                return ResponseEntity.badRequest().body(response);
            }
            
            // In production:
            // 1. Validate reset token
            // 2. Check token expiry
            // 3. Find user associated with token
            // 4. Update password
            // 5. Invalidate token
            
            // For now, return not implemented
            response.put("error", "Password reset requires token validation implementation");
            response.put("note", "This endpoint requires email integration and token management");
            
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to reset password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/verify-email
     * Verify user's email address using verification token
     * 
     * This would be called when user clicks verification link in email.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            Map<String, Object> response = new HashMap<>();
            String token = request.get("token");
            
            if (token == null || token.isEmpty()) {
                response.put("error", "Verification token is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // In production:
            // 1. Validate verification token
            // 2. Find user associated with token
            // 3. Mark email as verified
            // 4. Activate account if needed
            
            response.put("error", "Email verification requires token validation implementation");
            response.put("note", "This endpoint requires email integration and token management");
            
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to verify email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/refresh
     * Refresh authentication token
     * 
     * For JWT-based authentication, this refreshes the access token using a refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // In production with JWT:
            // 1. Validate refresh token
            // 2. Extract user information
            // 3. Generate new access token
            // 4. Return new token
            
            response.put("message", "Token refresh requires JWT implementation");
            response.put("note", "This endpoint is for JWT-based authentication systems");
            
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to refresh token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * GET /api/auth/validate
     * Validate if current session/token is valid
     * 
     * Quick endpoint to check authentication status.
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateAuthentication(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "userId", required = false) String userId) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // In production:
            // - Validate JWT token
            // - Check token expiry
            // - Verify user still exists and is active
            
            if (userId != null && !userId.isEmpty()) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent() && userOpt.get().isActive()) {
                    response.put("valid", true);
                    response.put("authenticated", true);
                    response.put("user", convertToDTO(userOpt.get()));
                    return ResponseEntity.ok(response);
                }
            }
            
            response.put("valid", false);
            response.put("authenticated", false);
            response.put("message", "No valid authentication found");
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed: " + e.getMessage());
            errorResponse.put("valid", false);
            errorResponse.put("authenticated", false);
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

