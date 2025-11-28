package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import com.arangodb.springframework.repository.ArangoRepository;

import com.ecapybara.carbonx.model.User;

public interface UserRepository extends ArangoRepository<User, String> {
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Find user by username
    Optional<User> findByUsername(String username);
    
    // Find users by role
    List<User> findByRole(String role);
    
    // Find active users
    List<User> findByActive(boolean active);
    
    // Find users by company name
    List<User> findByCompanyName(String companyName);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Check if username exists
    boolean existsByUsername(String username);
}

