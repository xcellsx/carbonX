package com.ecapybara.carbonx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.carbonx.service.DatabaseService;

@RestController
@RequestMapping("/api/database")
public class DatabaseController {

    @Autowired
    private DatabaseService databaseService;

    // GET all databases
    @GetMapping
    public String getAllDatabases() {
        return databaseService.getAllDatabases();
    }

    // POST create new database
    @PostMapping
    public String createDatabase(@RequestParam String name) {
        return databaseService.createDatabase(name);
    }
    //Delete named database
    @DeleteMapping
    public String deleteDatabase(@RequestParam String name) {
        return databaseService.deleteDatabase(name);
    }
}
