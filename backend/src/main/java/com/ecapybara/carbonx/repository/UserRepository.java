package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.basic.User;

public interface UserRepository extends ArangoRepository<User, String> {

  @NonNull Optional<User> findById(@NonNull String id);

  List<User> findByUsername(Sort sort, String username);

  List<User> findByEmail(Sort sort, String email);

  List<User> findByFirstName(Sort sort, String firstName);

  List<User> findByRole(Sort sort, String firstName);

  List<User> findByCompanyName(Sort sort, String companyName);

  List<User> findByActive(Sort sort, Boolean active);

  List<User> findByEmailAndActive(Sort sort, String email, Boolean active);

  void removeById(String id);
}
