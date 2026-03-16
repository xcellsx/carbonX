package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.service.TemplateService;
import com.ecapybara.carbonx.service.arango.ArangoDocumentService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/templates")

public class TemplateController {
	@Autowired
	private TemplateService templateService;
	@Autowired
	private ArangoQueryService queryService;
	@Autowired
	private ArangoDocumentService documentService;

	// Get the entire network graph and assembles the data into the JSON-D3 format that frontend can use
	@GetMapping
	public ResponseEntity<Object> listTemplates(@RequestParam(defaultValue = "default") String database,
												@RequestParam(defaultValue = "all") String nodeType) {

		Map<String,?> result;
		switch (nodeType) {
			case "low":
				// Fetch low-level nodes
				Collection<String> lowProducts = templateService.listLeafNodes(database, "products");
				Collection<String> lowProcesses = templateService.listLeafNodes(database, "processes");

				// Send Map<String,Collection<String>>
				result = Map.of("products", lowProducts,
									"processes", lowProcesses);
				log.info("Identified leaf nodes -> {}", result);
				return new ResponseEntity<>(result, HttpStatus.OK);

			case "intermediate":
				// Fetch intermediate-level nodes
				Collection<String> intermediateProducts = templateService.listIntermediateNodes(database, "products");
				Collection<String> intermediateProcesses = templateService.listIntermediateNodes(database, "processes");

				// Send Map<String,Collection<String>>
				result = Map.of("products", intermediateProducts,
									"processes", intermediateProcesses);
				log.info("Identified intermediate nodes -> {}", result);
				return new ResponseEntity<>(result, HttpStatus.OK);

			case "high":
				// Fetch high-level nodes
				Collection<String> highProducts = templateService.listRootNodes(database, "products");
				Collection<String> highProcesses = templateService.listRootNodes(database, "processes");

				// Send Map<String,Collection<String>>
				result = Map.of("products", highProducts,
									"processes", highProcesses);
				log.info("Identified root nodes -> {}", result);
				return new ResponseEntity<>(result, HttpStatus.OK);

			case "all":
				// Fetch high-level nodes
				Collection<String> allProducts = templateService.listAllNodes(database, "products");
				Collection<String> allProcesses = templateService.listAllNodes(database, "processes");

				// Send Map<String,Collection<String>>
				result = Map.of("products", allProducts,
									"processes", allProcesses);
				log.info("Identified all nodes -> {}", result);
				return new ResponseEntity<>(result, HttpStatus.OK);

			default:
				return new ResponseEntity<>("Error identifying 'nodeType' request parameter", HttpStatus.BAD_REQUEST);            
		}
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> saveTemplate(@RequestParam String database, @RequestBody Map<String,List<Object>> template) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			if (!template.containsKey("products") || !template.containsKey("processes") || !template.containsKey("inputs") || !template.containsKey("outputs")) {
				throw new IllegalArgumentException("Missing JSON key to create template!");
			}

			List<Product> productList = mapper.convertValue(template.get("products"), new TypeReference<List<Product>>() {});
			List<Process> processList = mapper.convertValue(template.get("processes"), new TypeReference<List<Process>>() {});
			List<Input> inputList = mapper.convertValue(template.get("inputs"), new TypeReference<List<Input>>() {});
			List<Output> outputList = mapper.convertValue(template.get("outputs"), new TypeReference<List<Output>>() {});

			documentService.createDocuments(database, "products", productList, true, null, null, null, null).block();
			documentService.createDocuments(database, "processes", processList, true, null, null, null, null).block();
			documentService.createDocuments(database, "inputs", inputList, true, null, null, null, null).block();
			documentService.createDocuments(database, "outputs", outputList, true, null, null, null, null).block();

			return new ResponseEntity<>(HttpStatus.OK);

		} catch (IllegalArgumentException e) {
			return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
		}
	}

	@GetMapping("/{collection}/{key}")
	public ResponseEntity<Object> getTemplate(@RequestParam(defaultValue = "default") String database, 
											  @PathVariable String collection,
											  @PathVariable String key) {
		
		String query =  "LET products = ( FOR v, e, p IN 0..100 INBOUND @startNode GRAPH 'default' \n" +
						"					FILTER PARSE_IDENTIFIER(v).collection == 'products' \n" +
						"					RETURN v ) \n" +
						"LET processes = ( FOR v, e, p IN 0..100 INBOUND @startNode GRAPH 'default' \n" +
						"					FILTER PARSE_IDENTIFIER(v).collection == 'processes' \n" +
						"					RETURN v ) \n" +
						"LET inputs = (FOR v, e, p IN 0..100 INBOUND @startNode GRAPH 'default' \n" +
						"				FILTER PARSE_IDENTIFIER(e).collection == 'inputs' \n" +
						"				RETURN e ) \n" +
						"LET outputs = (FOR v, e, p IN 0..100 INBOUND @startNode GRAPH 'default' \n" +
						"				FILTER PARSE_IDENTIFIER(e).collection == 'outputs' \n" +
						"				RETURN e) \n" +
						"RETURN {products, processes, inputs, outputs}";
		
		Map<String,String> bindVars = Map.of("startNode", collection+"/"+key);

		
		ArrayList<Map<String,Object>> response = (ArrayList<Map<String,Object>>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return new ResponseEntity<>(response.get(0), HttpStatus.OK);
	}

	// This fetches the specific product template and assembles the data into the JSON-D3 format that frontend can use
	@GetMapping("/{collection}/{key}/map")
	public ResponseEntity<Object> getTemplateMap(@RequestParam(defaultValue = "default") String database, 
												 @PathVariable String collection,
												 @PathVariable String key) {

		String query =  "LET nodes = ( \r\n" +
						"    FOR v, e, p IN 1..100 INBOUND @startNode GRAPH default \r\n" +
						"        COLLECT id = v._id, label = v.name, type = PARSE_IDENTIFIER(v._id).collection \r\n" +
						"        RETURN { id, label, type }) \r\n" +
						"LET edges = ( \r\n" +
						"    FOR v, e, p IN 1..100 INBOUND @startNode GRAPH default \r\n" +
						"        FILTER e != null \r\n" +
						"        COLLECT source = e._from, target = e._to, type = PARSE_IDENTIFIER(e._id).collection \r\n" +
						"        RETURN { source, target, type }) \r\n" +
						"RETURN { nodes, edges }";

		Map<String, String> bindVars = Map.of("startNode", collection+"/"+key);
		log.info("bindvars -> {}", bindVars);
		ArrayList<Map<String,ArrayList<Map<String,String>>>> response = (ArrayList<Map<String,ArrayList<Map<String,String>>>>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		log.info("response -> {}", response);

		return new ResponseEntity<>(response.get(0), HttpStatus.OK);
	}
}
