package com.carbonx.lca.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.lca.domain.AnalyticsEvent;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {}


