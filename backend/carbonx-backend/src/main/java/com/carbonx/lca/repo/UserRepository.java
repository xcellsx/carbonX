package com.carbonx.lca.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.lca.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {}


