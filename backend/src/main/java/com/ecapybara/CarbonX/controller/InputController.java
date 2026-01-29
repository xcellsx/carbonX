package com.ecapybara.carbonx.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.Input;
import com.ecapybara.carbonx.repository.InputRepository;
import org.springframework.web.bind.annotation.PutMapping;


@RestController
@RequestMapping("/api/inputs")
public class InputController {

  @Autowired
  private InputRepository inputRepository;
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Input> getInputs(@RequestParam(name = "from", required = false) String productName, @RequestParam(name = "to", required = false) String processName) {
    if (productName!=null && processName!=null && !productName.isEmpty() && !processName.isEmpty()) {
      return inputRepository.findByProductNameAndProcessName(sort, productName, processName);
    }

    else if (productName != null && !productName.isEmpty()) {
      return inputRepository.findByProductName(sort, productName);
    }

    else if (processName != null && !processName.isEmpty()) {
      return inputRepository.findByProcessName(sort, processName);
    }
    
    else {
      return inputRepository.findAll();
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Input> createInputs(@RequestBody List<Input> inputsList) {
    for (Input input : inputsList) {
      System.out.println("New input created:");
      System.out.println(input.toString());

      inputRepository.save(input);
      input = inputRepository.findByProductNameAndProcessName(sort, input.getProductName(), input.getProcessName()).get(0);
      System.out.println("Created input saved into input database:");
      System.out.println(input.toString());
    }
    return inputsList;
  }

  @PutMapping
  public List<Input> editInputs(@RequestBody List<Input> revisedInputs) {
    for (Input inputRevision : revisedInputs) {
      Input input = editInput(inputRevision.getId(), inputRevision);
      inputRevision = input;
    }
    return revisedInputs;
  }

  @GetMapping("/{id}")
  public Input getInput(@PathVariable String id) {
    return inputRepository.findById(id).orElse(null);
  }

  @PutMapping("/{id}")
  public Input editInput(@PathVariable String id, @RequestBody Input inputRevision) {
    Input input = inputRepository.findById(id).orElse(null);

    if (input != null) {
      input.setProduct(inputRevision.getProduct());
      input.setProcess(inputRevision.getProcess());
      inputRepository.save(input);
    }
    
    return inputRepository.findById(id).orElse(null);
  }

  @DeleteMapping("/{id}") 
  public String removeInput(@PathVariable String id) {
    Input input = inputRepository.findById(id).orElse(null);

    if (input != null) {
      inputRepository.removeById(id);
      System.out.println(String.format("Input %s successfully removed from the database", id));
      return input.toString();
    }

    else {
      return String.format("Input %s does not exist in database!", id);
    }
  }
}
