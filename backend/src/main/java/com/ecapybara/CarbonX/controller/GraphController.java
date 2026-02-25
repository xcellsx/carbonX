package com.ecapybara.carbonx.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.service.GraphService;

@RestController
@RequestMapping("/api/graph")

public class GraphController {
    @Autowired
    private GraphService graphService;

    @GetMapping("/metadata")
    public String getGraphMetadata(@RequestParam String name) {
        return graphService.getGraphMetadata(name);
    }
    @GetMapping("/edges")
    public String getEdgeCollections(@RequestParam String name) {
        return graphService.getEdgeCollections(name);
    }
    @GetMapping("/vertices")
    public String getNodeCollections(@RequestParam String name) {
        return graphService.getNodeCollections(name);
    }

    // @PostMapping("/graph")
    // public Map<String, Object> getGraph(){
    // // String query = request.get("query");
    // return graphService.getGraph();
    // }

    @PostMapping ("/query")
    public Object sendQuery(@RequestParam String database, @RequestBody String query) {
        
        Map<String, Object> response = graphService.executeQuery(database, query);

        return response.get("result");
    }

    // @GetMapping ("/getentiregraph")
    // public Object getGraphbyName(@RequestParam String database, @RequestParam String graphname) {
    
    
    //     Map<String, Object> response = graphService.executeQuery(database, query);

    //     return response.get("result");
    // }

    @GetMapping ("/productgraph")
        public Object getProductGraph(@RequestParam String database, @RequestParam String productid) {
        //currently hardcoded to use products,processes,inputs and outputs, can be improved later
        String targetNode = "products/"+productid;
        String edgeList = "inputs, outputs";

        String query =
        "LET targetNode = \"" + targetNode + "\" " +

        "LET traversal = ( " +
        "FOR v, e, p IN 1..100 INBOUND targetNode " +
        edgeList + " " +
        "FILTER e != null " +
        "RETURN { " +
            "node: { " +
                "id: v._id, " +
                "label: HAS(v, \"name\") ? v.name : v._key, " +
                "type: PARSE_IDENTIFIER(v._id).collection " +
            "}, " +
            "edge: { " +
                "source: e._from, " +
                "target: e._to, " +
                "type: PARSE_IDENTIFIER(e._id).collection " +
            "} " +
        "} " +
        ") " +

        "LET nodes = UNIQUE(traversal[* RETURN CURRENT.node]) " +
        "LET links = UNIQUE(traversal[* RETURN CURRENT.edge]) " +

        "LET rootNode = { " +
            "id: targetNode, " +
            "label: HAS(DOCUMENT(targetNode), \"name\") " +
                "? DOCUMENT(targetNode).name " +
                ": PARSE_IDENTIFIER(targetNode).key, " +
            "type: PARSE_IDENTIFIER(targetNode).collection " +
        "} " +

        "RETURN { nodes: APPEND(nodes, rootNode, true), links: links }";

        Map<String, Object> response = graphService.executeQuery(database, query);

        return response.get("result");
    }
}
