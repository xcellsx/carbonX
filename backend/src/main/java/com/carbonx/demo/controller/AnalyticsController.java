package com.carbonx.demo.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.service.OpenLCAService;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private OpenLCAService openLcaService;

    /**
     * Logic for "Inputs" and "Outputs" tabs.
     * Fetches the process flows from OpenLCA.
     */
    @GetMapping("/flows")
    public ResponseEntity<?> getProcessFlows(
            @RequestParam String processIdentifier,
            @RequestParam Double weight) {

        String processUuid = openLcaService.resolveProcessIdentifier(processIdentifier);
        
        if (processUuid == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Process not found: " + processIdentifier));
        }

        List<Map<String, Object>> flows = openLcaService.getProcessFlows(processUuid, weight);
        return ResponseEntity.ok(flows);
    }

    /**
     * Logic for "Impact Categories" tab.
     * Fetches the LCIA results from OpenLCA.
     */
    @GetMapping("/impacts")
    public ResponseEntity<?> getProcessImpacts(
            @RequestParam String processIdentifier,
            @RequestParam Double weight) {

        String processUuid = openLcaService.resolveProcessIdentifier(processIdentifier);

        if (processUuid == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Process not found: " + processIdentifier));
        }

        List<Map<String, Object>> impacts = openLcaService.getImpactResults(processUuid, weight);
        return ResponseEntity.ok(impacts);
    }
}