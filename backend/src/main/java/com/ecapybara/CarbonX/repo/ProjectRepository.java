package com.carbonx.lca.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.lca.domain.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {}


