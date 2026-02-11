package com.ecapybara.carbonx.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import com.ecapybara.carbonx.config.AppLogger;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.repository.ProcessRepository;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.GraphService;

import reactor.core.publisher.Mono;


@RestController
@RequestMapping("/api/processes")
public class ProcessController {

  @Autowired
  private DocumentService documentService;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ProcessRepository processRepository;

  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Process> getProcesses(@RequestParam(name = "name", required = false) String name, @RequestParam(name = "type", required = false) String type) {
    if (name!=null && !name.isEmpty() && type!=null && !type.isEmpty()) {
      return processRepository.findByNameAndType(sort, name, type);
    }
    else if (name!=null && !name.isEmpty()) {
      return processRepository.findByName(sort, name);
    }
    else if (type!=null && !type.isEmpty()) {
      return processRepository.findByType(sort, type);
    }
    else {
      return processRepository.findAll();
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Process> createProcesses(@RequestBody List<Process> processesList) {
    
    for (Process process : processesList) {
      System.out.println("----- New process created:");
      System.out.println(process.toString());

      processRepository.save(process);
      process = processRepository.findByNameAndType(sort, process.getName(), process.getType()).get(0);
      System.out.println("Created process saved into process database:");
      System.out.println(process.toString());
    }
    
    return processesList;
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
    return documentService.getDocument("processes", id)
            .bodyToMono(Process.class)
            .doOnNext(body -> log.info("API Response:\n{}", body));
  }

  @PutMapping("/{id}")
  public Process editProcess(@PathVariable String id, @RequestBody Process revisedProcess) {
    Process process = processRepository.findById(id).orElse(null);

    if (process != null) {
      process.setName(revisedProcess.getName());
      process.setType(revisedProcess.getType());
      process.setDPP(revisedProcess.getDPP());
      processRepository.save(process);
    }
    
    return processRepository.findById(id).orElse(null);
  }

  // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
  @DeleteMapping("/{id}")
  public Mono<Boolean> deleteProcess(@PathVariable String id) {
    return graphService.deleteDocuments("processes", id);
  }
}