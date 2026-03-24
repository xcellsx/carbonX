package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.service.LCAService;

@RestController
@RequestMapping("/api/lca")
public class LcaController {

    @Autowired
    private LCAService lcaService;

    // @GetMapping("/{targetCollection}/{documentKey}")
    // public Mono<?> getLCA(@PathVariable String targetCollection, @PathVariable String documentKey) {
    //     switch (targetCollection) {
    //         case "products":
    //             return documentService.getDocument(targetCollection, documentKey, null, null)
    //                 .map(rawDocument -> {
    //                     Product product = objectMapper.convertValue(rawDocument, Product.class);
    //                     product = lcaService.calculateRoughCarbonFootprint(product, "default");
    //                     productController.editProduct(product.getId(), product); // still side-effecting
    //                     return product.getDPP().getCarbonFootprint();
    //                 });

    //         case "processes":
    //             return documentService.getDocument(targetCollection, documentKey, null, null)
    //                 .map(rawMap -> objectMapper.convertValue(rawMap, Process.class))
    //                 .map(process -> {
    //                     process = lcaService.calculateRoughCarbonFootprint(process, "default");
    //                     processController.editProcess(process.getId(), process); // still side-effecting
    //                     return process.getDPP().getCarbonFootprint();
    //                 });

    //         default:
    //             return Mono.error(new RuntimeException("Invalid target collection name!"));
    //     }
    // }

    @GetMapping("/rough")
    public ResponseEntity<Object> getLCA(@RequestParam(required = false, defaultValue = "default") String database,
                                         @RequestParam(required = true) String collection,
                                         @RequestParam(required = true) String documentKey) {

        String key = documentKey.contains("/") ? documentKey.split("/")[1] : documentKey;
        String documentId = collection + "/" + key;

        Map<String,Object> response = lcaService.calculateRoughCarbonFootprint(database, documentId);
        
        try {
            if (response.containsKey("errorMessage")) {
                throw new IllegalArgumentException("Error");
            }

            ArrayList<Map> result = (ArrayList<Map>) response.get("result");
            return new ResponseEntity<>(result.get(0), HttpStatus.OK);

        } catch (IllegalArgumentException e) {
			return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
		}
    }

    @GetMapping("/emissions")
    public ResponseEntity<Object> getEmissionLCA(@RequestParam(required = false, defaultValue = "default") String database,
                                                 @RequestParam(required = true) String collection,
                                                 @RequestParam(required = true) String documentKey) {

        String key = documentKey.contains("/") ? documentKey.split("/")[1] : documentKey;
        String documentId = collection + "/" + key;

        Map<String,Object> response = lcaService.calculateEmissionInformation(database, documentId);

        try {
            if (response.containsKey("errorMessage")) {
                throw new IllegalArgumentException();
            }

            ArrayList<Map> result = (ArrayList<Map>) response.get("result");
            return new ResponseEntity<>(result.get(0), HttpStatus.OK);

        } catch (IllegalArgumentException e) {
			return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
		}
    }

    @GetMapping("/detailed")
    public ResponseEntity<Object> getDetailedLCA(@RequestParam(required = false, defaultValue = "default") String database,
                                                 @RequestParam(required = true) String collection,
                                                 @RequestParam(required = true) String documentKey) {

        String key = documentKey.contains("/") ? documentKey.split("/")[1] : documentKey;
        String documentId = collection + "/" + key;

        Map<String,Object> response = lcaService.calculateDetailedCarbonFootprint(database, documentId);

        try {
            if (response.containsKey("errorMessage")) {
                throw new IllegalArgumentException();
            }

            ArrayList<Map> result = (ArrayList<Map>) response.get("result");
            return new ResponseEntity<>(result.get(0), HttpStatus.OK);

        } catch (IllegalArgumentException e) {
			return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
		}
    }
}