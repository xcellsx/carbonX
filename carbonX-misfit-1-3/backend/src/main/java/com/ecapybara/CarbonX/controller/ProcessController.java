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
import com.ecapybara.CarbonX.model.Process;
import com.ecapybara.CarbonX.repository.ProcessRepository;
import com.ecapybara.CarbonX.service.DocumentService;
import com.ecapybara.CarbonX.service.GraphService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/processes")
public class ProcessController {

  @Autowired
  private DocumentService documentService;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ProcessRepository processRepository;

  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Process> getProcesses(@RequestParam(name = "name", required = false) String name, 
                                         @RequestParam(name = "type", required = false) String type) {
    try {
      log.info("Fetching processes - name: {}, type: {}", name, type);
      
      if (name != null && !name.isEmpty() && type != null && !type.isEmpty()) {
        return processRepository.findByNameAndType(sort, name, type);
      } else if (name != null && !name.isEmpty()) {
        return processRepository.findByName(sort, name);
      } else if (type != null && !type.isEmpty()) {
        return processRepository.findByType(sort, type);
      } else {
        return processRepository.findAll();
      }
    } catch (Exception e) {
      log.error("Error fetching processes: {}", e.getMessage(), e);
      throw new DatabaseOperationException("fetch", "Failed to retrieve processes");
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Process> createProcesses(@RequestBody List<Process> processesList) {
    try {
      if (processesList == null || processesList.isEmpty()) {
        throw new ValidationException("Processes list cannot be empty");
      }

      log.info("Creating {} process(es)", processesList.size());

      for (Process process : processesList) {
        log.debug("Creating new process: {}", process);
        
        processRepository.save(process);
        
        List<Process> savedProcesses = processRepository.findByNameAndType(
            sort, process.getName(), process.getType());
        
        if (savedProcesses.isEmpty()) {
          log.error("Failed to retrieve saved process - name: {}, type: {}", 
              process.getName(), process.getType());
          throw new DatabaseOperationException("create", "Failed to verify created process");
        }
        
        Process savedProcess = savedProcesses.get(0);
        process.setId(savedProcess.getId());
        log.info("Successfully created process with ID: {}", savedProcess.getId());
      }
      
      return processesList;
    } catch (ValidationException | DatabaseOperationException e) {
      throw e;
    } catch (Exception e) {
      log.error("Unexpected error creating processes: {}", e.getMessage(), e);
      throw new DatabaseOperationException("create", "Failed to create processes");
    }
  }

  @PutMapping
  public List<Process> editProcesses(@RequestBody List<Process> revisedProcesses) {
    for (Process processRevision : revisedProcesses) {
      Process process = editProcess(processRevision.getId(), processRevision);
      processRevision = process;
    }
    return revisedProcesses;
  }

  @GetMapping("/{id}")
  public Mono<Process> getProcess(@PathVariable String id) {
    log.info("Fetching process by ID from ArangoDB: {}", id);
    return documentService.getDocuments("processes", id)
            .bodyToMono(Process.class)
            .doOnNext(body -> log.info("Successfully fetched process: {}", body))
            .doOnError(error -> log.error("Error fetching process {}: {}", id, error.getMessage(), error));
  }

  @PutMapping("/{id}")
  public Process editProcess(@PathVariable String id, @RequestBody Process revisedProcess) {
    try {
      log.info("Editing process with ID: {}", id);
      
      Process process = processRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Process", "id", id));

      process.setName(revisedProcess.getName());
      process.setType(revisedProcess.getType());
      process.setFunctionalProperties(revisedProcess.getFunctionalProperties());
      process.setDPP(revisedProcess.getDPP());
      processRepository.save(process);
      
      log.info("Successfully updated process with ID: {}", id);
      return processRepository.findById(id)
          .orElseThrow(() -> new DatabaseOperationException("update", "Failed to retrieve updated process"));
          
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error updating process {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("update", "Failed to update process");
    }
  }

  // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
  @DeleteMapping("/{id}")
  public Mono<Boolean> deleteProcess(@PathVariable String id) {
    log.info("Deleting process with ID: {}", id);
    return graphService.deleteDocuments("processes", id)
        .doOnSuccess(result -> log.info("Successfully deleted process {}: {}", id, result))
        .doOnError(error -> log.error("Error deleting process {}: {}", id, error.getMessage(), error));
  }
}