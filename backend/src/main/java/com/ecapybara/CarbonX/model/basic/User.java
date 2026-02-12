package com.ecapybara.carbonx.model.basic;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;

@Data @AllArgsConstructor @Builder(toBuilder = true)
@Document("users")
@PersistentIndex(fields = {"id", "email", "username", "firstName", "role"})
public class User {

    @ArangoId // db document field: _id
    private String id;

    @Id // db document field: _key
    private String key;    

    @NonNull
    private String username;

    @NonNull
    private String email;
    
    @NonNull
    private String password; // Note: In production, this should be hashed

    @NonNull
    private String firstName;

    private String lastName;
    
    @Builder.Default
    @NonNull
    private String role = "user"; // e.g., "admin", "user", "supplier"

    @NonNull
    private String companyName;

    private Boolean active;

    @NonNull
    private final LocalDateTime createdAt;
    
    @NonNull
    private final LocalDateTime updatedAt;

    @Override
    public String toString() {
        return "User [id=" + id + ", username=" + username + ", email=" + email + 
               ", firstName=" + firstName + ", lastName=" + lastName + 
               ", role=" + role + ", active=" + active + "]";
    }
}

