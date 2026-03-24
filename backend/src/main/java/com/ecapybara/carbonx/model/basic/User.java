package com.ecapybara.carbonx.model.basic;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;

@Data @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Document("users")
@PersistentIndex(fields = {"id", "email", "username", "firstName", "role", "active"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {

    @JsonProperty("_class")
    private final String clazz = this.getClass().getTypeName();

    @ArangoId // db document field: _id
    private String id;

    @Id // db document field: _key
    private String key;    

    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String companyName;
    private Boolean active;

    @Override
    public String toString() {
        try {
        ObjectMapper mapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return mapper.writeValueAsString(this);
        } catch (Exception e) {
        return super.toString(); // fallback
        }
    }
}

