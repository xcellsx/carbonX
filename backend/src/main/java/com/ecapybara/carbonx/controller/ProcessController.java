package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/processes")
public class ProcessController {

    @Autowired
    private ArangoDatabaseService databaseService;
    @Autowired
    private DocumentService documentService;
    @Autowired
    private ArangoGraphService graphService;
    @Autowired
    private ArangoQueryService queryService;

    final Sort sort = Sort.by(Direction.DESC, "id");

    @GetMapping
    public ResponseEntity<Object> searchProcesses(@RequestParam(required = false, defaultValue = "default") String database,
                                                  @RequestParam(required = false) String key,
                                                  @RequestParam(required = false) String name,
                                                  @RequestParam(required = false) String type,
                                                  @RequestParam(required = false) String serviceProvider,
                                                  @RequestParam(required = false) String userId) {
        
        // Build AQL query string and associated 'bindVars'
        StringBuilder query = new StringBuilder("FOR doc in processes ");
        Map<String,String> bindVars = new HashMap<>();
        if (key != null) {
            query.append("FILTER doc._key == @key ");
            bindVars.put("key", key);
        }
        if (name != null) {
            query.append("FILTER doc.name == @name ");
            bindVars.put("name", name);
        }
        if (type != null) {
            query.append("FILTER doc.type == @type ");
            bindVars.put("type", type);
        }
        if (serviceProvider != null) {
            query.append("FILTER doc.serviceProvider == @serviceProvider ");
            bindVars.put("serviceProvider", serviceProvider);
        }
        if (userId != null) {
            query.append("FILTER doc.userId == @userId ");
            bindVars.put("userId", userId);
        }
        query.append("RETURN doc");

        // Execute query string in appropriate database
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> response = queryService.executeQuery(database, query.toString(), bindVars, 100, null, null, null).block();            
            List<Process> processList = mapper.convertValue(response.get("result"), new TypeReference<List<Process>>() {});
            return new ResponseEntity<>(processList, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }
    

    @GetMapping("/all")
    public ResponseEntity<Object> listAllProcesses() {
        ObjectMapper mapper = new ObjectMapper();
        List<Process> result = new ArrayList<>();
        try {
            Map<String,Object> response = databaseService.listDatabases().block();
            List<String> databases = mapper.convertValue(response.get("result"), new TypeReference<List<String>>() {});
            databases.remove("_system");

            for (String database : databases) {
                response = documentService.getAllDocuments(database, "processes").block();
                result = ListUtils.union(result, mapper.convertValue(response.get("result"), new TypeReference<List<Process>>() {}));
            }
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> createProcesses(@PathVariable String companyName, @RequestBody List<Object> rawProcesses) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Process> processList = mapper.convertValue(rawProcesses, new TypeReference<List<Process>>() {});
            List<Object> response = documentService.createDocuments(companyName, "processes", processList, true, null, null, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editProcesses(@PathVariable String companyName, @RequestBody List<Object> revisedProcesses) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Process> processList = mapper.convertValue(revisedProcesses, new TypeReference<List<Process>>() {});
            List<Object> response = documentService.updateDocuments(companyName, "processes", processList, true, true, null, null, true, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{companyName}/{key}")
    public ResponseEntity<Object> getProcess(@PathVariable String companyName, @PathVariable String key) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> rawDocument = documentService.getDocument(companyName, "processes", key, null, null).block();
            Process process = mapper.convertValue(rawDocument, new TypeReference<Process>() {});
            return new ResponseEntity<>(process, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editProcess(@PathVariable String companyName, @PathVariable String key, @RequestBody Map<String,Object> revisedProcess) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Process process = mapper.convertValue(revisedProcess, new TypeReference<Process>() {});
            Map<String,Object> response = documentService.updateDocument(companyName, "processes", key, process, true, true, null, null, null, true, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
    @DeleteMapping("/{companyName}/{key}")
    public ResponseEntity<Object> deleteProcess(@PathVariable String companyName, @PathVariable String key) {
        Map<String,Object> response = graphService.deleteVertex(companyName, "default", "processes", key, true, true).block();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}