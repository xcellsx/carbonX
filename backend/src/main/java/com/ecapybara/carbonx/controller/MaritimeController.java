package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.ListUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.model.maritime.Ship;
import com.ecapybara.carbonx.model.maritime.ShipLog;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.ecapybara.carbonx.service.industry.maritime.MaritimeLCAService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/maritime")
public class MaritimeController {

    @Autowired
    private MaritimeLCAService maritimeLCAService;
    @Autowired
    private DocumentService documentService;
    @Autowired
    private ArangoQueryService queryService;

    @GetMapping("/ships")
    public ResponseEntity<Object> getShip(@RequestParam(required = true) String companyName,
                                          @RequestParam(required = true) String mmsi) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> rawDocument = documentService.getDocument(companyName, "ships", mmsi, null, null).block();
            Ship product = mapper.convertValue(rawDocument, new TypeReference<Ship>() {});
            return new ResponseEntity<>(product, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/shiplogs")
    public ResponseEntity<Object> searchShipLogs(@RequestParam(required = true) String companyName,
                                                 @RequestParam(required = false) String mmsi,
                                                 @RequestParam(required = false) String flag,
                                                 @RequestParam(required = false) String dateOnly,
                                                 @RequestParam(required = false, defaultValue = "25000") int limit) {
                                            
        // Build AQL query string and associated 'bindVars'
        StringBuilder query = new StringBuilder("FOR doc in shipLogs ");
        Map<String,String> bindVars = new HashMap<>();
        if (mmsi != null) {
            query.append("FILTER doc.mmsi == @mmsi ");
            bindVars.put("mmsi", mmsi);
        }
        if (flag != null) {
            query.append("FILTER doc.flag == @flag ");
            bindVars.put("flag", flag);
        }
        if (dateOnly != null) {
            query.append("FILTER doc.dateOnly == @dateOnly ");
            bindVars.put("dateOnly", dateOnly);
        }
        query.append("RETURN doc");

        int batchSize = Math.min(Math.max(limit, 1), 100_000);

        // Execute query string in appropriate database
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> response = queryService.executeQuery(companyName, query.toString(), bindVars, batchSize, null, null, null).block();       
            List<ShipLog> shipLogs = mapper.convertValue(response.get("result"), new TypeReference<List<ShipLog>>() {});
            return new ResponseEntity<>(shipLogs, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/shiplogs/{mmsi}/locations")
    public ResponseEntity<Object> getShipLocations( @RequestParam(required = true) String companyName,
                                                    @PathVariable String mmsi) {
                                            
        // Build AQL query string and associated 'bindVars'
        StringBuilder query = new StringBuilder(
                "FOR doc IN shipLogs FILTER TO_STRING(doc.mmsi) == TO_STRING(@mmsi) SORT doc.timestamp ASC RETURN { "
                        + "'longitude': doc.longitude, 'latitude': doc.latitude, 'timestamp': doc.timestamp }");
        Map<String,String> bindVars = Map.of("mmsi", mmsi);

        // Execute query string in appropriate database
        try {
            Map<String,Object> response = queryService.executeQuery(companyName, query.toString(), bindVars, 25_000, null, null, null).block();
            return new ResponseEntity<>(response.get("result"), HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/lca")
    public ResponseEntity<Object> getLCA(@RequestParam(required = true) String companyName,
                                         @RequestParam(required = true) String mmsi) {
                                            
        Map<String,Object> result = maritimeLCAService.calculateRoughCarbonFootprint(companyName, mmsi);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

}
