package com.ecapybara.carbonx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.dto.InputLinkRequest;
import com.ecapybara.carbonx.dto.OutputLinkRequest;
import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.service.LinkageService;

/**
 * REST API to connect product and process nodes with one-way edges only.
 * - Input link: Product → Process (product is input to process).
 * - Output link: Process → Product (process produces product).
 * No reverse edges are created; each link is a single direction.
 */
@RestController
@RequestMapping("/api/linkages")
public class LinkageController {

  @Autowired
  private LinkageService linkageService;

  /**
   * Create a one-way link from a product to a process (input).
   * Body: { "productId": "products/xyz" or "xyz", "processId": "processes/abc" or "abc" }
   */
  @PostMapping(value = "/input", consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Input createInputLink(@RequestBody InputLinkRequest request) {
    if (request.getProductId() == null || request.getProcessId() == null) {
      throw new IllegalArgumentException("productId and processId are required");
    }
    return linkageService.createInputLink(request.getProductId(), request.getProcessId());
  }

  /**
   * Create a one-way link from a process to a product (output).
   * Body: { "processId": "processes/abc" or "abc", "productId": "products/xyz" or "xyz" }
   */
  @PostMapping(value = "/output", consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Output createOutputLink(@RequestBody OutputLinkRequest request) {
    if (request.getProcessId() == null || request.getProductId() == null) {
      throw new IllegalArgumentException("processId and productId are required");
    }
    return linkageService.createOutputLink(request.getProcessId(), request.getProductId());
  }
}
