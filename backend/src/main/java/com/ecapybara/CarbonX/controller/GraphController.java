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
}
