package com.ecapybara.carbonx.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.basic.User;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private ArangoDatabaseService databaseService;
    @Autowired
    private DocumentService documentService;
    @Autowired
    private ArangoGraphService graphService;
    @Autowired
    private ArangoQueryService queryService;

    @GetMapping("/{companyName}")
    public ResponseEntity<Object> searchUsers(@PathVariable String companyName,
                                              @RequestParam(required = false) String email,
                                              @RequestParam(required = false) String username,
                                              @RequestParam(required = false) String key,
                                              @RequestParam(required = false) String firstName,
                                              @RequestParam(required = false) String lastName,
                                              @RequestParam(required = false) String role,
                                              @RequestParam(required = false) String active) {

        StringBuilder query = new StringBuilder("FOR doc in users ");
        Map<String,String> bindVars = new HashMap<>();
        if (key != null) {
            query.append("FILTER doc._key == @key ");
            bindVars.put("key", key);
        }
        if (email != null) {
            query.append("FILTER doc.email == @email ");
            bindVars.put("email", email);
        }
        if (username != null) {
            query.append("FILTER doc.username == @username ");
            bindVars.put("username", username);
        }
        if (firstName != null) {
            query.append("FILTER doc.firstName == @firstName ");
            bindVars.put("firstName", firstName);
        }
        if (lastName != null) {
            query.append("FILTER doc.lastName == @lastName ");
            bindVars.put("lastName", lastName);
        }
        if (role != null) {
            query.append("FILTER doc.role == @role ");
            bindVars.put("role", role);
        }
        if (active != null) {
            query.append("FILTER doc.active == @active ");
            bindVars.put("active", active);
        }
        query.append("RETURN doc");

        // Execute query string in appropriate database
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> response = queryService.executeQuery(companyName, query.toString(), bindVars, 100, null, null, null).block();       
            List<User> userList = mapper.convertValue(response.get("result"), new TypeReference<List<User>>() {});
            return new ResponseEntity<>(userList, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> createUser(@PathVariable String companyName, @RequestBody Object rawUser) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            User user = mapper.convertValue(rawUser, new TypeReference<User>() {});
            Object response = documentService.createDocument(companyName, "users", user, true, null, null, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editUsers(@PathVariable String companyName, @RequestBody List<Object> revisedUsers) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<User> userList = mapper.convertValue(revisedUsers, new TypeReference<List<User>>() {});
            List<Object> response = documentService.updateDocuments(companyName, "users", userList, true, true, null, null, true, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{companyName}/{key}")
    public ResponseEntity<Object> getUser(@PathVariable String companyName, @PathVariable String key) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> rawDocument = documentService.getDocument(companyName, "users", key, null, null).block();
            User user = mapper.convertValue(rawDocument, new TypeReference<User>() {});
            return new ResponseEntity<>(user, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editUser(@PathVariable String companyName, @PathVariable String key, @RequestBody Map<String,Object> revisedUser) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            User user = mapper.convertValue(revisedUser, new TypeReference<User>() {});
            Map<String,Object> response = documentService.updateDocument(companyName, "users", key, user, true, true, null, null, null, true, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
    @DeleteMapping("/{companyName}/{key}")
    public ResponseEntity<Object> deleteUser(@PathVariable String companyName, @PathVariable String key) {
        Map<String,Object> response = documentService.deleteDocument(companyName, "users", key, true, true, null, null).block();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

/* 
    @GetMapping
    public List<User> getUsers(@RequestParam(name = "email", required = false) String email, @RequestParam(name = "active", required = false) Boolean active) {
        if (email != null && !email.isEmpty() && active!=null) {
            return userRepository.findByEmailAndActive(sort, email, active);
        }
        else if (email != null && !email.isEmpty()) {
            return userRepository.findByEmail(sort, email);
        }
        else if (active != null) {
            return userRepository.findByActive(sort, active);
        }
        else {
            return IterableUtils.toList(userRepository.findAll());
        }
    }

    @PostMapping(value = "/{company}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public User createUser(@RequestBody User user) {
        userRepository.save(user);
        user = userRepository.findByEmail(sort, user.getEmail()).get(0);
        System.out.println("Created user saved into USER database:");
        System.out.println(user.toString());
        return user;
    }

    @GetMapping("/{company}/{key}")
    public ResponseEntity<Object> getUser(@PathVariable String company, @PathVariable String key) {
        Map<String,Object> rawDocument = documentService.getDocument(company, "users", key, null, null).block();
        User user = objectMapper.convertValue(rawDocument, User.class);                                             
        return new ResponseEntity<>(user, HttpStatus.FOUND);
    }
*/
}
