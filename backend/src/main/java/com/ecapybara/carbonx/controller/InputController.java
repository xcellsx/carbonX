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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.web.bind.annotation.PutMapping;


@RestController
@RequestMapping("/api/inputs")
public class InputController {

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
    public ResponseEntity<Object> searchInputs( @RequestParam(required = false, defaultValue = "default") String database,
                                                @RequestParam(required = false) String key,
                                                @RequestParam(required = false) String fromKey,
                                                @RequestParam(required = false) String toKey,
                                                @RequestParam(required = false) String productName,
                                                @RequestParam(required = false) String processName) {
        
        // Build AQL query string and associated 'bindVars'
        StringBuilder query = new StringBuilder("FOR doc in inputs ");
        Map<String,String> bindVars = new HashMap<>();
        if (key != null) {
            query.append("FILTER doc._key == @key ");
            bindVars.put("key", key);
        }
        if (fromKey != null) {
            query.append("FILTER doc._from == @fromKey ");
            bindVars.put("fromKey", "products/" + fromKey);
        }
        if (toKey != null) {
            query.append("FILTER doc._to == @to ");
            bindVars.put("to", "processes/" + toKey);
        }
        if (productName != null) {
            query.append("FILTER doc.productName == @productName ");
            bindVars.put("productName", productName);
        }
        if (processName != null) {
            query.append("FILTER doc.processName == @processName ");
            bindVars.put("processName", processName);
        }
        query.append("RETURN doc");

        // Execute query string in appropriate database
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> response = queryService.executeQuery(database, query.toString(), bindVars, 100, null, null, null).block();       
            List<Input> inputList = mapper.convertValue(response.get("result"), new TypeReference<List<Input>>() {});
            return new ResponseEntity<>(inputList.toString(), HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Object> listAllInputs() {
        ObjectMapper mapper = new ObjectMapper();
        List<Input> result = new ArrayList<>();
        try {
            Map<String,Object> response = databaseService.listDatabases().block();
            List<String> databases = mapper.convertValue(response.get("result"), new TypeReference<List<String>>() {});
            databases.remove("_system");

            for (String database : databases) {
                response = documentService.getAllDocuments(database, "inputs").block();
                result = ListUtils.union(result, mapper.convertValue(response.get("result"), new TypeReference<List<Input>>() {}));
            }
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> createInputs(@PathVariable String companyName, @RequestBody List<Object> rawInputs) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Input> inputList = mapper.convertValue(rawInputs, new TypeReference<List<Input>>() {});
            List<Object> response = documentService.createDocuments(companyName, "inputs", inputList, true, null, null, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editInputs(@PathVariable String companyName, @RequestBody List<Object> revisedInputs) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Input> inputList = mapper.convertValue(revisedInputs, new TypeReference<List<Input>>() {});
            List<Object> response = documentService.updateDocuments(companyName, "inputs", inputList, true, true, null, null, true, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{companyName}/{key}")
    public ResponseEntity<Object> getInput(@PathVariable String companyName, @PathVariable String key) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> rawDocument = documentService.getDocument(companyName, "inputs", key, null, null).block();
            Input input = mapper.convertValue(rawDocument, new TypeReference<Input>() {});
            return new ResponseEntity<>(input, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editInput(@PathVariable String companyName, @PathVariable String key, @RequestBody Map<String,Object> revisedInput) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Input input = mapper.convertValue(revisedInput, new TypeReference<Input>() {});
            Map<String,Object> response = documentService.updateDocument(companyName, "inputs", key, input, true, true, null, null, null, true, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
    @DeleteMapping("/{companyName}/{key}")
    public ResponseEntity<Object> deleteInput(@PathVariable String companyName, @PathVariable String key) {
        Map<String,Object> response = graphService.deleteEdge(companyName, "default", "inputs", key, true, true).block();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
