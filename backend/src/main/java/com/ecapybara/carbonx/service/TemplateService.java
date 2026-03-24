package com.ecapybara.carbonx.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.ecapybara.carbonx.config.AppLogger;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;

@Service
public class TemplateService {
  
  @Autowired
  private ArangoQueryService queryService;
  @Autowired
  private WebClient webClient;
  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);

	// unfinished - "database" variable not wired up properly
	public Collection<String> listLeafNodes(String database, String collection) {
		String query = "FOR v IN @@collection \r\n" + //
										"FILTER LENGTH( \r\n" + //
										"    FOR e IN 1..1 INBOUND v GRAPH default \r\n" + //
										"    RETURN 1" + //
										") == 0 \r\n" + //
										"RETURN v._id\r\n" + //
										"";

		Map<String, String> bindVars = Map.of("@collection", collection);
		Collection<String> result = (Collection<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return result;
	}

	// unfinished - "database" variable not wired up properly
	public Collection<String> listRootNodes(String database, String collection) {
		String query = "FOR v IN @@collection \r\n" + //
										"FILTER LENGTH( \r\n" + //
										"    FOR e IN 1..1 OUTBOUND v GRAPH default \r\n" + //
										"    RETURN 1" + //
										") == 0 \r\n" + //
										"RETURN v._id\r\n" + //
										"";

		Map<String, String> bindVars = Map.of("@collection", collection);
		Collection<String> result = (Collection<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return result;
	}

	// unfinished - "database" variable not wired up properly
	public Collection<String> listIntermediateNodes(String database, String collection) {
		String query = "FOR v IN @@collection \r\n" + //
										"FILTER LENGTH( \r\n" + //
										"    FOR e IN 1..1 INBOUND v GRAPH default \r\n" + //
										"    RETURN 1" + //
										") > 0 AND LENGTH( \r\n" + //
										"    FOR e IN 1..1 OUTBOUND v GRAPH default \r\n" + //
										"    RETURN 1" + //
										") > 0 \r\n" +
										"RETURN v._id\r\n" + //
										"";

		Map<String, String> bindVars = Map.of("@collection", collection);
		Collection<String> result = (Collection<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return result;
	}

	// unfinished - "database" variable not wired up properly
	public Collection<String> listAllNodes(String database, String collection) {
		String query = "FOR v IN @@collection \r\n" +
										"RETURN v._id";

		Map<String, String> bindVars = Map.of("@collection", collection);
		Collection<String> result = (Collection<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return result;
	}

	// unfinished - "database" variable not wired up properly
	public Collection<String> getComponents(String database, String nodeId) {
		String query =  "FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH default \r\n" +
										"OPTIONS { bfs: true} \r\n" +
										"FILTER v._id != @startNode \r\n" +
										"RETURN v._id";
		
		Map<String, String> bindVars = Map.of("@startNode", nodeId);
		Collection<String> result = (Collection<String>) queryService.executeQuery(database, query, bindVars, 100, null, null, null).block().get("result");
		return result;
	}
}
