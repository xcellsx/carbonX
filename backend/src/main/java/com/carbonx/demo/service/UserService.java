package com.carbonx.demo.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired; // Ensure User model is imported
import org.springframework.stereotype.Service; // Ensure UserRepository is imported

import com.carbonx.demo.model.User; // Ensure Autowired is imported
import com.carbonx.demo.repository.UserRepository; // Ensure Service is imported

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User registerUser(User user) {
        // TODO: Hash password before saving
        return userRepository.save(user);
    }

    public boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // --- NEW METHOD for Login ---
    /**
     * Authenticates a user based on email and password.
     *
     * @param email    The user's email.
     * @param password The user's plain text password.
     * @return The authenticated User object if credentials match, otherwise null.
     */
    public User loginUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // IMPORTANT: This is a direct string comparison.
            // In a real application, you MUST hash passwords during signup
            // and compare the hash of the provided password with the stored hash here.
            if (user.getPassword().equals(password)) {
                return user; // Credentials match
            }
        }
        return null; // User not found or password incorrect
    }
    // --- END NEW METHOD ---
}