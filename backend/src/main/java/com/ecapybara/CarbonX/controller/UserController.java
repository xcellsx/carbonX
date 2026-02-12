package com.ecapybara.carbonx.controller;

import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.IterableUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.config.AppLogger;
import com.ecapybara.carbonx.model.basic.User;
import com.ecapybara.carbonx.repository.UserRepository;
import com.ecapybara.carbonx.service.arango.ArangoDocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/company/users")
public class UserController {
  @Autowired
  private UserRepository userRepository;
  @Autowired
  private ArangoDocumentService documentService;
  @Autowired
  private ObjectMapper objectMapper;

  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);
  final Sort sort = Sort.by(Direction.DESC, "id");

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

  @GetMapping("/{key}")
  public Mono<User> getUser(@PathVariable String key) {
    Map<String,Object> rawDocument = documentService.getDocument("users", key, null, null)
                                                    .block();
    User user = objectMapper.convertValue(rawDocument, User.class);                                             
    return Mono.just(user);
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public User createUser(@RequestBody User user) {

    userRepository.save(user);
    user = userRepository.findByEmail(sort, user.getEmail()).get(0);
    System.out.println("Created user saved into USER database:");
    System.out.println(user.toString());
    return user;
  }
}
