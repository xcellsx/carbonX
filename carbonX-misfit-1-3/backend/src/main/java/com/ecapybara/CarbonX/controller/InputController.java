package com.ecapybara.CarbonX.controller;

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
import org.springframework.web.bind.annotation.PutMapping;

import com.ecapybara.CarbonX.exception.DatabaseOperationException;
import com.ecapybara.CarbonX.exception.ResourceNotFoundException;
import com.ecapybara.CarbonX.exception.ValidationException;
import com.ecapybara.CarbonX.model.Input;
import com.ecapybara.CarbonX.repository.InputRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/inputs")
public class InputController {

  @Autowired
  private InputRepository inputRepository;
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Input> getInputs(@RequestParam(name = "from", required = false) String productName, 
                                    @RequestParam(name = "to", required = false) String processName) {
    try {
      log.info("Fetching inputs - productName: {}, processName: {}", productName, processName);
      
      if (productName != null && processName != null && !productName.isEmpty() && !processName.isEmpty()) {
        return inputRepository.findByProductNameAndProcessName(sort, productName, processName);
      } else if (productName != null && !productName.isEmpty()) {
        return inputRepository.findByProductName(sort, productName);
      } else if (processName != null && !processName.isEmpty()) {
        return inputRepository.findByProcessName(sort, processName);
      } else {
        return inputRepository.findAll();
      }
    } catch (Exception e) {
      log.error("Error fetching inputs: {}", e.getMessage(), e);
      throw new DatabaseOperationException("fetch", "Failed to retrieve inputs");
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Input> createInputs(@RequestBody List<Input> inputsList) {
    try {
      if (inputsList == null || inputsList.isEmpty()) {
        throw new ValidationException("Inputs list cannot be empty");
      }

      log.info("Creating {} input(s)", inputsList.size());

      for (Input input : inputsList) {
        log.debug("Creating new input: {}", input);
        
        inputRepository.save(input);
        
        List<Input> savedInputs = inputRepository.findByProductNameAndProcessName(
            sort, input.getProductName(), input.getProcessName());
        
        if (savedInputs.isEmpty()) {
          log.error("Failed to retrieve saved input - productName: {}, processName: {}", 
              input.getProductName(), input.getProcessName());
          throw new DatabaseOperationException("create", "Failed to verify created input");
        }
        
        Input savedInput = savedInputs.get(0);
        input.setId(savedInput.getId());
        log.info("Successfully created input with ID: {}", savedInput.getId());
      }
      
      return inputsList;
    } catch (ValidationException | DatabaseOperationException e) {
      throw e;
    } catch (Exception e) {
      log.error("Unexpected error creating inputs: {}", e.getMessage(), e);
      throw new DatabaseOperationException("create", "Failed to create inputs");
    }
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
    log.info("Fetching input by ID: {}", id);
    return inputRepository.findById(id)
        .orElseThrow(() -> {
          log.error("Input not found with ID: {}", id);
          return new ResourceNotFoundException("Input", "id", id);
        });
  }

  @PutMapping("/{id}")
  public Input editInput(@PathVariable String id, @RequestBody Input inputRevision) {
    try {
      log.info("Editing input with ID: {}", id);
      
      Input input = inputRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Input", "id", id));

      input.setProduct(inputRevision.getProduct());
      input.setProcess(inputRevision.getProcess());
      inputRepository.save(input);
      
      log.info("Successfully updated input with ID: {}", id);
      return inputRepository.findById(id)
          .orElseThrow(() -> new DatabaseOperationException("update", "Failed to retrieve updated input"));
          
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error updating input {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("update", "Failed to update input");
    }
  }

  @DeleteMapping("/{id}") 
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeInput(@PathVariable String id) {
    try {
      log.info("Deleting input with ID: {}", id);
      
      Input input = inputRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Input", "id", id));

      inputRepository.removeById(id);
      log.info("Successfully deleted input with ID: {}", id);
      
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error deleting input {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("delete", "Failed to delete input");
    }
  }
}
