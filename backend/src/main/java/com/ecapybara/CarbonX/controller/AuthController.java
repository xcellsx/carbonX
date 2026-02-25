package com.ecapybara.carbonx.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.dto.LoginRequest;
import com.ecapybara.carbonx.dto.RegisterRequest;
import com.ecapybara.carbonx.dto.UserDTO;
import com.ecapybara.carbonx.model.basic.User;
import com.ecapybara.carbonx.repository.UserRepository;

/**
 * Handles signup (registration). Ensures email is valid (@domain) and unique.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** Valid email: something @ something . something */
    private static final Pattern VALID_EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Autowired
    private UserRepository userRepository;

    private final Sort sort = Sort.by(Direction.DESC, "id");

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(new ErrorBody("Invalid request."));
        }

        String fullName = request.getFullName();
        String email = request.getEmail();
        String password = request.getPassword();

        if (fullName == null || fullName.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Full name is required."));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Email is required."));
        }
        email = email.trim().toLowerCase();
        if (!VALID_EMAIL.matcher(email).matches()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Please enter a valid email address."));
        }
        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(new ErrorBody("Password must be at least 6 characters."));
        }

        List<User> existing = userRepository.findByEmail(sort, email);
        if (existing != null && !existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorBody("An account with this email already exists."));
        }

        LocalDateTime now = LocalDateTime.now();
        User user = User.builder()
                .username(email)
                .email(email)
                .password(password)
                .firstName(fullName.trim())
                .lastName("")
                .role("user")
                .companyName("")
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();

        user = userRepository.save(user);
        UserDTO dto = toDTO(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Sign in with email and password. Only succeeds for users that are already
     * registered (onboarded). Returns 401 if no account exists or password is wrong.
     */
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Email is required."));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Password is required."));
        }

        String email = request.getEmail().trim().toLowerCase();
        if (!VALID_EMAIL.matcher(email).matches()) {
            return ResponseEntity.badRequest().body(new ErrorBody("Please enter a valid email address."));
        }

        List<User> users = userRepository.findByEmail(sort, email);
        if (users == null || users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorBody("Account is not registered."));
        }

        User user = users.get(0);
        String storedPassword = user.getPassword();
        if (storedPassword == null || !storedPassword.equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorBody("Invalid email or password."));
        }

        UserDTO dto = toDTO(user);
        return ResponseEntity.ok(dto);
    }

    private static UserDTO toDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName() != null ? u.getLastName() : "");
        dto.setRole(u.getRole());
        dto.setCompanyName(u.getCompanyName() != null ? u.getCompanyName() : "");
        dto.setActive(Boolean.TRUE.equals(u.getActive()));
        dto.setCreatedAt(u.getCreatedAt());
        dto.setUpdatedAt(u.getUpdatedAt());
        return dto;
    }

    @SuppressWarnings("unused")
    public static class ErrorBody {
        private String message;

        public ErrorBody(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
