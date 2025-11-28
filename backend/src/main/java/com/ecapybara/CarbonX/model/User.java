package com.ecapybara.carbonx.model;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;

import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;

@Document("users")
@PersistentIndex(fields = {"email"})
public class User {

    @Id // db document field: _key
    private String id;

    @ArangoId // db document field: _id
    private String arangoId;

    private String username;
    private String email;
    private String password; // Note: In production, this should be hashed
    private String firstName;
    private String lastName;
    private String role; // e.g., "admin", "user", "supplier"
    private String companyName;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public User() {
        super();
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String username, String email) {
        this();
        this.username = username;
        this.email = email;
    }

    public User(String username, String email, String password, String firstName, String lastName) {
        this();
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = "user"; // default role
    }

    @Override
    public String toString() {
        return "User [id=" + id + ", username=" + username + ", email=" + email + 
               ", firstName=" + firstName + ", lastName=" + lastName + 
               ", role=" + role + ", active=" + active + "]";
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getArangoId() {
        return arangoId;
    }

    public void setArangoId(String arangoId) {
        this.arangoId = arangoId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

