package com.ecapybara.carbonx.service;

import java.util.ArrayList;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.model.basic.Node;
import com.ecapybara.carbonx.model.basic.DigitalProductPassport;
import com.ecapybara.carbonx.model.ghg.CarbonFootprint;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class LCAService {

  @Autowired
  private ArangoQueryService queryService;

  // unfinished
  public <T extends Node> T calculateRoughCarbonFootprint(T node, String graphName) {
    if (node == null) return null;
    // Ensure DPP and carbonFootprint exist (product from Arango may have null DPP)
    if (node.getDPP() == null) {
      node.setDPP(new DigitalProductPassport());
    }
    if (node.getDPP().getCarbonFootprint() == null) {
      node.getDPP().setCarbonFootprint(new CarbonFootprint());
    }
    // 1. Get sum of leaf node values
    // String query = "FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH @graphName OPTIONS { bfs: true, uniqueVertices: 'global', optimize: true } FILTER LENGTH(FOR neighbor, edge IN 1..1 INBOUND v GRAPH @graphName RETURN 1) == 0 COLLECT AGGREGATE total = SUM(v.quantityValue) RETURN v._id";
    String query = "FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH @graphName \r\n" + //
            "OPTIONS { bfs: true, uniqueVertices: 'global'} \r\n" + //
            "FILTER LENGTH(FOR neighbor, edge IN 1..1 INBOUND v GRAPH @graphName RETURN 1) == 0 \r\n" + //
            "FILTER v.DPP != null \r\n" + //
            "COLLECT \r\n" + //
            "  AGGREGATE \r\n" + //
            "    rawS1 = SUM(v.DPP.carbonFootprint.scope1.kgCO2e),\r\n" + //
            "    rawS2 = SUM(v.DPP.carbonFootprint.scope2.kgCO2e),\r\n" + //
            "    rawS3 = SUM(v.DPP.carbonFootprint.scope3.kgCO2e)\r\n" + //
            "LET \r\n" + //
            "  s1 = ROUND(rawS1 * 100) / 100.0,\r\n" + //
            "  s2 = ROUND(rawS2 * 100) / 100.0,\r\n" + //
            "  s3 = ROUND(rawS3 * 100) / 100.0\r\n" + //
            "RETURN {s1, s2, s3}\r\n" + //
            "";
    Map<String, String> bindVars = Map.of("startNode", node.getId(),
                                          "graphName", graphName);
    ArrayList<Map<String,Double>> response = (ArrayList<Map<String,Double>>) queryService.executeQuery(query, bindVars, 100, null, null, null).block().get("result");
    Map<String,Double> leafResult = (response != null && !response.isEmpty()) ? response.get(0) : Map.of("s1", 0.0, "s2", 0.0, "s3", 0.0);
    if (leafResult == null) leafResult = Map.of("s1", 0.0, "s2", 0.0, "s3", 0.0);
    log.info("Calculated values for leaf nodes -> {}", leafResult);

    // 2. Get sum of all process node values
    query = "FOR v IN 1..100 INBOUND @startNode GRAPH @graphName \r\n" + //
            "FILTER v._class == @vertexClass \r\n" + //
            "FILTER v.DPP != null \r\n" + //
            "COLLECT \r\n" + //
            "  AGGREGATE \r\n" + //
            "    rawS1 = SUM(v.DPP.carbonFootprint.scope1.kgCO2e),\r\n" + //
            "    rawS2 = SUM(v.DPP.carbonFootprint.scope2.kgCO2e),\r\n" + //
            "    rawS3 = SUM(v.DPP.carbonFootprint.scope3.kgCO2e)\r\n" + //
            "LET \r\n" + //
            "  s1 = ROUND(rawS1 * 100) / 100.0,\r\n" + //
            "  s2 = ROUND(rawS2 * 100) / 100.0,\r\n" + //
            "  s3 = ROUND(rawS3 * 100) / 100.0\r\n" + //
            "RETURN {s1, s2, s3}\r\n" + //
            "";
    bindVars = Map.of("startNode", node.getId(),
                      "graphName", graphName,
                      "vertexClass", "com.ecapybara.carbonx.model.issb.Process");
    response = (ArrayList<Map<String,Double>>) queryService.executeQuery(query, bindVars, 100, null, null, null).block().get("result");
    Map<String,Double> processResult = (response != null && !response.isEmpty()) ? response.get(0) : Map.of("s1", 0.0, "s2", 0.0, "s3", 0.0);
    if (processResult == null) processResult = Map.of("s1", 0.0, "s2", 0.0, "s3", 0.0);
    log.info("Calculated values for process nodes -> {}", processResult);

    // 3. Update node (safe get: leafResult/processResult may have null values)
    log.info("Prior DPP -> {}", node.getDPP());
    double s1 = safeDouble(leafResult, "s1") + safeDouble(processResult, "s1");
    double s2 = safeDouble(leafResult, "s2") + safeDouble(processResult, "s2");
    double s3 = safeDouble(leafResult, "s3") + safeDouble(processResult, "s3");
    node.getDPP().getCarbonFootprint().setScope1(Map.of("kgCO2e", s1));
    node.getDPP().getCarbonFootprint().setScope2(Map.of("kgCO2e", s2));
    node.getDPP().getCarbonFootprint().setScope3(Map.of("kgCO2e", s3));
    log.info("New DPP -> {}", node.getDPP());

    return node;
  }

  private static double safeDouble(Map<String, Double> m, String key) {
    if (m == null) return 0;
    Double v = m.get(key);
    return (v != null) ? v.doubleValue() : 0.0;
  }

  // ---- Unfinished
  public <T extends Node> T calculateDetailedCarbonFootprint(T node, String graphName) {
    return null;
  }

  // ---- Unfinished
  public <T extends Node> T calculateEmissionInformation(T node, String graphName) {
    return null;
  }
}