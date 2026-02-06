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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.CarbonX.exception.DatabaseOperationException;
import com.ecapybara.CarbonX.exception.ResourceNotFoundException;
import com.ecapybara.CarbonX.exception.ValidationException;
import com.ecapybara.CarbonX.model.Output;
import com.ecapybara.CarbonX.repository.OutputRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/outputs")
public class OutputController {

  @Autowired
  private OutputRepository outputRepository;
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Output> getOutputs(@RequestParam(name = "from", required = false) String processName, 
                                      @RequestParam(name = "to", required = false) String productName) {
    try {
      log.info("Fetching outputs - processName: {}, productName: {}", processName, productName);
      
      if (productName != null && processName != null && !productName.isEmpty() && !processName.isEmpty()) {
        return outputRepository.findByProcessNameAndProductName(sort, processName, productName);
      } else if (productName != null && !productName.isEmpty()) {
        return outputRepository.findByProductName(sort, productName);
      } else if (processName != null && !processName.isEmpty()) {
        return outputRepository.findByProcessName(sort, processName);
      } else {
        return outputRepository.findAll();
      }
    } catch (Exception e) {
      log.error("Error fetching outputs: {}", e.getMessage(), e);
      throw new DatabaseOperationException("fetch", "Failed to retrieve outputs");
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Output> createOutputs(@RequestBody List<Output> outputsList) {
    try {
      if (outputsList == null || outputsList.isEmpty()) {
        throw new ValidationException("Outputs list cannot be empty");
      }

      log.info("Creating {} output(s)", outputsList.size());

      for (Output output : outputsList) {
        log.debug("Creating new output: {}", output);
        
        outputRepository.save(output);
        
        List<Output> savedOutputs = outputRepository.findByProcessNameAndProductName(
            sort, output.getProcessName(), output.getProductName());
        
        if (savedOutputs.isEmpty()) {
          log.error("Failed to retrieve saved output - processName: {}, productName: {}", 
              output.getProcessName(), output.getProductName());
          throw new DatabaseOperationException("create", "Failed to verify created output");
        }
        
        Output savedOutput = savedOutputs.get(0);
        output.setId(savedOutput.getId());
        log.info("Successfully created output with ID: {}", savedOutput.getId());
      }
      
      return outputsList;
    } catch (ValidationException | DatabaseOperationException e) {
      throw e;
    } catch (Exception e) {
      log.error("Unexpected error creating outputs: {}", e.getMessage(), e);
      throw new DatabaseOperationException("create", "Failed to create outputs");
    }
  }

  @PutMapping
  public List<Output> editOutputs(@RequestBody List<Output> revisedOutputs) {
    for (Output outputRevision : revisedOutputs) {
      Output output = editOutput(outputRevision.getId(), outputRevision);
      outputRevision = output;
    }
    return revisedOutputs;
  }

  @GetMapping("/{id}")
  public Output getOutput(@PathVariable String id) {
    log.info("Fetching output by ID: {}", id);
    return outputRepository.findById(id)
        .orElseThrow(() -> {
          log.error("Output not found with ID: {}", id);
          return new ResourceNotFoundException("Output", "id", id);
        });
  }

  @PutMapping("/{id}")
  public Output editOutput(@PathVariable String id, @RequestBody Output outputRevision) {
    try {
      log.info("Editing output with ID: {}", id);
      
      Output output = outputRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Output", "id", id));

      output.setProcess(outputRevision.getProcess());
      output.setProduct(outputRevision.getProduct());      
      outputRepository.save(output);
      
      log.info("Successfully updated output with ID: {}", id);
      return outputRepository.findById(id)
          .orElseThrow(() -> new DatabaseOperationException("update", "Failed to retrieve updated output"));
          
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error updating output {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("update", "Failed to update output");
    }
  }

  @DeleteMapping("/{id}") 
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeOutput(@PathVariable String id) {
    try {
      log.info("Deleting output with ID: {}", id);
      
      Output output = outputRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Output", "id", id));

      outputRepository.removeById(id);
      log.info("Successfully deleted output with ID: {}", id);
      
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error deleting output {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("delete", "Failed to delete output");
    }
  }
}
