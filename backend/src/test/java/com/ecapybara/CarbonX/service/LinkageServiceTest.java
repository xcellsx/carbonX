package com.ecapybara.CarbonX.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.ecapybara.CarbonX.model.issb.Input;
import com.ecapybara.CarbonX.model.issb.Output;
import com.ecapybara.CarbonX.model.issb.Process;
import com.ecapybara.CarbonX.model.issb.Product;
import com.ecapybara.CarbonX.repository.InputRepository;
import com.ecapybara.CarbonX.repository.OutputRepository;
import com.ecapybara.CarbonX.repository.ProcessRepository;
import com.ecapybara.CarbonX.repository.ProductRepository;

/**
 * Verifies that LinkageService creates edges that belong to the graph:
 * - Input edges: Product → Process (stored in collection "inputs", same as graph edge definition).
 * - Output edges: Process → Product (stored in collection "outputs", same as graph edge definition).
 */
@ExtendWith(MockitoExtension.class)
class LinkageServiceTest {

  private static final String PRODUCT_ID = "products/p1";
  private static final String PROCESS_ID = "processes/proc1";

  @Mock
  private ProductRepository productRepository;
  @Mock
  private ProcessRepository processRepository;
  @Mock
  private InputRepository inputRepository;
  @Mock
  private OutputRepository outputRepository;

  @InjectMocks
  private LinkageService linkageService;

  private Product product;
  private Process process;

  @BeforeEach
  void setUp() {
    product = Product.builder().id(PRODUCT_ID).name("Product1").type("type1").build();
    process = Process.builder().id(PROCESS_ID).name("Process1").type("type1").build();
  }

  @Test
  void createInputLink_savesEdgeWithProductToProcess() {
    when(productRepository.findById("p1")).thenReturn(Optional.of(product));
    when(processRepository.findById("proc1")).thenReturn(Optional.of(process));
    when(inputRepository.findByFromAndTo(PRODUCT_ID, PROCESS_ID)).thenReturn(Collections.emptyList());

    Input saved = new Input(product, process);
    when(inputRepository.save(any(Input.class))).thenReturn(saved);

    Input result = linkageService.createInputLink(PRODUCT_ID, PROCESS_ID);

    assertNotNull(result);
    ArgumentCaptor<Input> captor = ArgumentCaptor.forClass(Input.class);
    verify(inputRepository).save(captor.capture());
    Input captured = captor.getValue();
    assertEquals(PRODUCT_ID, captured.getProduct().getId(), "Input edge _from must be product id (graph: products → processes)");
    assertEquals(PROCESS_ID, captured.getProcess().getId(), "Input edge _to must be process id");
    verify(inputRepository).findByFromAndTo(PRODUCT_ID, PROCESS_ID);
  }

  @Test
  void createInputLink_idempotent_returnsExisting() {
    when(productRepository.findById("p1")).thenReturn(Optional.of(product));
    when(processRepository.findById("proc1")).thenReturn(Optional.of(process));
    Input existing = new Input(product, process);
    when(inputRepository.findByFromAndTo(PRODUCT_ID, PROCESS_ID)).thenReturn(List.of(existing));

    Input result = linkageService.createInputLink(PRODUCT_ID, PROCESS_ID);

    assertSame(existing, result);
    verify(inputRepository).findByFromAndTo(PRODUCT_ID, PROCESS_ID);
    verify(inputRepository, never()).save(any(Input.class));
  }

  @Test
  void createOutputLink_savesEdgeWithProcessToProduct() {
    when(processRepository.findById("proc1")).thenReturn(Optional.of(process));
    when(productRepository.findById("p1")).thenReturn(Optional.of(product));
    when(outputRepository.findByFromAndTo(PROCESS_ID, PRODUCT_ID)).thenReturn(Collections.emptyList());

    Output saved = new Output(process, product);
    when(outputRepository.save(any(Output.class))).thenReturn(saved);

    Output result = linkageService.createOutputLink(PROCESS_ID, PRODUCT_ID);

    assertNotNull(result);
    ArgumentCaptor<Output> captor = ArgumentCaptor.forClass(Output.class);
    verify(outputRepository).save(captor.capture());
    Output captured = captor.getValue();
    assertEquals(PROCESS_ID, captured.getProcess().getId(), "Output edge _from must be process id (graph: processes → products)");
    assertEquals(PRODUCT_ID, captured.getProduct().getId(), "Output edge _to must be product id");
    verify(outputRepository).findByFromAndTo(PROCESS_ID, PRODUCT_ID);
  }

  @Test
  void createInputLink_acceptsKeyOnly() {
    when(productRepository.findById("p1")).thenReturn(Optional.of(product));
    when(processRepository.findById("proc1")).thenReturn(Optional.of(process));
    when(inputRepository.findByFromAndTo(PRODUCT_ID, PROCESS_ID)).thenReturn(Collections.emptyList());
    when(inputRepository.save(any(Input.class))).thenAnswer(inv -> inv.getArgument(0));

    linkageService.createInputLink("p1", "proc1");

    verify(productRepository).findById(eq("p1"));
    verify(processRepository).findById(eq("proc1"));
  }
}
