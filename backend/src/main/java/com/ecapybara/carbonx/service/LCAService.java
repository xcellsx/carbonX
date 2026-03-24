package com.ecapybara.carbonx.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.model.basic.Node;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class LCAService {

    @Autowired
    private ArangoQueryService queryService;

    public Map<String,Object> calculateRoughCarbonFootprint(String database, String documentId) {

        String query = "FOR v IN UNION( \n" +
                        "[DOCUMENT(@startNode)], \n" +
                        "(FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH 'default' \n" +
                        "OPTIONS { bfs: true, uniqueVertices: 'global' } \n" +
                        "RETURN v) \n" +
                        ") \n" +
                        "COLLECT AGGREGATE \n" +
                        "  rawS1 = SUM(v.dpp.carbonFootprint.scope1.kgCO2e), \n" +
                        "  rawS2 = SUM(v.dpp.carbonFootprint.scope2.kgCO2e), \n" +
                        "  rawS3 = SUM(v.dpp.carbonFootprint.scope3.kgCO2e) \n" +
                        "LET scope1 = ROUND(rawS1 * 100) / 100.0, \n" +
                        "    scope2 = ROUND(rawS2 * 100) / 100.0, \n" +
                        "    scope3 = ROUND(rawS3 * 100) / 100.0 \n" +
                        "RETURN {scope1, scope2, scope3}";

        Map<String, String> bindVars = Map.of("startNode", documentId);
        return queryService.executeQuery(database, query, bindVars, 100, null, null, null).block();
    }

    public Map<String,Object> calculateDetailedCarbonFootprint(String database, String documentId) {

        String query = "FOR v IN UNION( \n" +
                    "[DOCUMENT(@startNode)], \n" +
                    "(FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH 'default' \n" +
                    "OPTIONS { bfs: true, uniqueVertices: 'global' } \n" +
                    "RETURN v) \n" +
                    ") \n" +
                    "LET s1 = v.dpp.carbonFootprint.scope1.kgCO2e == 0 OR v.dpp.carbonFootprint.scope1.kgCO2e == null \n" +
                    "    ? ( \n" +
                    "        (v.emissionInformation.scope1.stationaryCombustion.CO2.kg  * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope1.mobileCombustion.CH4.kg      * DOCUMENT('globalWarmingPotentials/CH4').gwp) + \n" +
                    "        (v.emissionInformation.scope1.fugitiveEmissions.N2O.kg     * DOCUMENT('globalWarmingPotentials/N2O').gwp) + \n" +
                    "        (v.emissionInformation.scope1.processEmissions.CO2.kg      * DOCUMENT('globalWarmingPotentials/CO2').gwp) \n" +
                    "      ) \n" +
                    "    : v.dpp.carbonFootprint.scope1.kgCO2e \n" +
                    "LET s2 = v.dpp.carbonFootprint.scope2.kgCO2e == 0 OR v.dpp.carbonFootprint.scope2.kgCO2e == null \n" +
                    "    ? ( \n" +
                    "        (v.emissionInformation.scope2.purchasedElectricity.CO2.kg  * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope2.purchasedSteam.HFC134a.kg    * DOCUMENT('globalWarmingPotentials/HFC134a').gwp) + \n" +
                    "        (v.emissionInformation.scope2.purchasedHeating.CO2.kg      * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope2.purchasedCooling.CO2.kg      * DOCUMENT('globalWarmingPotentials/CO2').gwp) \n" +
                    "      ) \n" +
                    "    : v.dpp.carbonFootprint.scope2.kgCO2e \n" +
                    "LET s3 = v.dpp.carbonFootprint.scope3.kgCO2e == 0 OR v.dpp.carbonFootprint.scope3.kgCO2e == null \n" +
                    "    ? ( \n" +
                    "        (v.emissionInformation.scope3.category1.CO2.kg     * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category2.CH4.kg     * DOCUMENT('globalWarmingPotentials/CH4').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category3.N2O.kg     * DOCUMENT('globalWarmingPotentials/N2O').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category4.CO2.kg     * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category5.CO2.kg     * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category6.SF6.kg     * DOCUMENT('globalWarmingPotentials/SF6').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category7.CO2.kg     * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category8.CH4.kg     * DOCUMENT('globalWarmingPotentials/CH4').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category9.N2O.kg     * DOCUMENT('globalWarmingPotentials/N2O').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category10.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category11.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category12.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category13.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category14.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) + \n" +
                    "        (v.emissionInformation.scope3.category15.CO2.kg    * DOCUMENT('globalWarmingPotentials/CO2').gwp) \n" +
                    "      ) \n" +
                    "    : v.dpp.carbonFootprint.scope3.kgCO2e \n" +
                    "COLLECT AGGREGATE \n" +
                    "    rawS1 = SUM(s1), \n" +
                    "    rawS2 = SUM(s2), \n" +
                    "    rawS3 = SUM(s3) \n" +
                    "RETURN { \n" +
                    "    scope1: ROUND(rawS1 * 100) / 100.0, \n" +
                    "    scope2: ROUND(rawS2 * 100) / 100.0, \n" +
                    "    scope3: ROUND(rawS3 * 100) / 100.0 \n" +
                    "}";

            Map<String, String> bindVars = Map.of("startNode", documentId);
            return queryService.executeQuery(database, query, bindVars, 100, null, null, null).block();
        }
    public Map<String,Object> calculateEmissionInformation(String database, String documentId) {
        //For now it only accounts for kg and g
        String query =
        "LET gwpMap = MERGE( \n" +
        "    FOR g IN globalWarmingPotentials \n" +
        "        RETURN { [g._key]: g.gwp } \n" +
        ") \n" +
        "LET ei = DOCUMENT(@startNode).emissionInformation \n" +
        "LET s1_total = SUM( \n" +
        "    FOR category IN ATTRIBUTES(ei.scope1) \n" +
        "        FOR gas IN ATTRIBUTES(ei.scope1[category]) \n" +
        "            LET kg = IS_NULL(ei.scope1[category][gas].kg) ? \n" +
        "                (IS_NULL(ei.scope1[category][gas].g) ? 0 : ei.scope1[category][gas].g / 1000) \n" +
        "                : ei.scope1[category][gas].kg \n" +
        "            LET gwp = IS_NULL(gwpMap[gas]) ? 0 : gwpMap[gas] \n" +
        "            RETURN kg * gwp \n" +
        ") \n" +
        "LET s2_total = SUM( \n" +
        "    FOR category IN ATTRIBUTES(ei.scope2) \n" +
        "        FOR gas IN ATTRIBUTES(ei.scope2[category]) \n" +
        "            LET kg = IS_NULL(ei.scope2[category][gas].kg) ? \n" +
        "                (IS_NULL(ei.scope2[category][gas].g) ? 0 : ei.scope2[category][gas].g / 1000) \n" +
        "                : ei.scope2[category][gas].kg \n" +
        "            LET gwp = IS_NULL(gwpMap[gas]) ? 0 : gwpMap[gas] \n" +
        "            RETURN kg * gwp \n" +
        ") \n" +
        "LET s3_total = SUM( \n" +
        "    FOR category IN ATTRIBUTES(ei.scope3) \n" +
        "        FOR gas IN ATTRIBUTES(ei.scope3[category]) \n" +
        "            LET kg = IS_NULL(ei.scope3[category][gas].kg) ? \n" +
        "                (IS_NULL(ei.scope3[category][gas].g) ? 0 : ei.scope3[category][gas].g / 1000) \n" +
        "                : ei.scope3[category][gas].kg \n" +
        "            LET gwp = IS_NULL(gwpMap[gas]) ? 0 : gwpMap[gas] \n" +
        "            RETURN kg * gwp \n" +
        ") \n" +
        "RETURN { \n" +
        "    scope1: ROUND(s1_total * 100) / 100, \n" +
        "    scope2: ROUND(s2_total * 100) / 100, \n" +
        "    scope3: ROUND(s3_total * 100) / 100 \n" +
        "}";

        Map<String, String> bindVars = Map.of("startNode", documentId);
        return queryService.executeQuery(database, query, bindVars, 100, null, null, null).block();
    }

  
  /*
  // unfinished
  public <T extends Node> T calculateRoughCarbonFootprint(T node, String graphName) {
    ObjectMapper mapper = new ObjectMapper();
    Map<String,Object> response;

    // 1. Get sum of leaf node values
    // String query = "FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH 'default' OPTIONS { bfs: true, uniqueVertices: 'global', optimize: true } FILTER LENGTH(FOR neighbor, edge IN 1..1 INBOUND v GRAPH 'default' RETURN 1) == 0 COLLECT AGGREGATE total = SUM(v.quantityValue) RETURN v._id";
    String query =  "FOR v, e, p IN 1..1000 INBOUND @startNode GRAPH 'default' \r\n" + //
                    "OPTIONS { bfs: true, uniqueVertices: 'global'} \r\n" + //
                    "FILTER LENGTH(FOR neighbor, edge IN 1..1 INBOUND v GRAPH 'default' RETURN 1) == 0 \r\n" + //
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
    response = queryService.executeQuery("default", query, bindVars, 100, null, null, null).block();
    ArrayList<Map<String,Double>> resultList = mapper.convertValue(response.get("result"), new TypeReference<ArrayList<Map<String,Double>>>() {});
    Map<String,Double> leafResult = resultList.get(0);
    log.info("Calculated values for leaf nodes -> {}", leafResult);

    // 2. Get sum of all process node values
    query = "FOR v IN 1..100 INBOUND @startNode GRAPH 'default' \r\n" + //
            "FILTER v._class == @vertexClass \r\n" + //
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
    response = queryService.executeQuery("default", query, bindVars, 100, null, null, null).block();
    resultList = mapper.convertValue(response.get("result"), new TypeReference<ArrayList<Map<String,Double>>>() {});
    Map<String,Double> processResult = resultList.get(0);
    log.info("Calculated values for process nodes -> {}", processResult);

    // 3. Update node
    log.info("Prior DPP -> {}", node.getDPP());
    node.getDPP().getCarbonFootprint().setScope1(Map.of("kgCO2e", leafResult.get("s1").doubleValue() + processResult.get("s1").doubleValue()));
    node.getDPP().getCarbonFootprint().setScope2(Map.of("kgCO2e", leafResult.get("s2").doubleValue() + processResult.get("s2").doubleValue()));
    node.getDPP().getCarbonFootprint().setScope3(Map.of("kgCO2e", leafResult.get("s3").doubleValue() + processResult.get("s3").doubleValue()));
    log.info("New DPP -> {}", node.getDPP());

    return node;
  }
  */

}