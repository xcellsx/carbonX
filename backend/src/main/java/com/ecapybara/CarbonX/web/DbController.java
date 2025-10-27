package com.carbonx.lca.web;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/db")
public class DbController {

    private final JdbcTemplate jdbcTemplate;

    public DbController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Integer one = jdbcTemplate.queryForObject("select 1", Integer.class);
        return Map.of("ok", one != null && one == 1);
    }
}


