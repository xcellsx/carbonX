package com.carbonx.lca.web;

import com.carbonx.lca.domain.Calculation;
import com.carbonx.lca.domain.Flow;
import com.carbonx.lca.domain.Impact;
import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.domain.Product;
import com.carbonx.lca.repo.CalculationRepository;
import com.carbonx.lca.repo.InventoryItemRepository;
import com.carbonx.lca.repo.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lca")
@CrossOrigin(origins = "*")
public class LcaController {

    private static final Logger log = LoggerFactory.getLogger(LcaController.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final ProductRepository productRepository;
    private final CalculationRepository calculationRepository;

    public LcaController(InventoryItemRepository inventoryItemRepository,
                         ProductRepository productRepository,
                         CalculationRepository calculationRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.productRepository = productRepository;
        this.calculationRepository = calculationRepository;
    }

    // --- DTOs for Analytics (Restructured to match openLCA format) ---
    public static class CalculatedProductDTO {
        public Long id;
        public String name;
        public String lcaStatus;
        public CalculatedProductDTO(Long id, String name, String lcaStatus) {
            this.id = id;
            this.name = name;
            this.lcaStatus = lcaStatus;
        }
    }
    
    // Corresponds to openLCA's "flow" object
    public static class FlowDetailsDTO {
        public String name;
        public String category;
        public String refUnit;
        public FlowDetailsDTO(String name, String category, String refUnit) {
            this.name = name;
            this.category = category;
            this.refUnit = refUnit;
        }
    }

    // Corresponds to openLCA's "enviFlow" object
    public static class EnviFlowDTO {
        public boolean isInput;
        public FlowDetailsDTO flow;
        public EnviFlowDTO(boolean isInput, FlowDetailsDTO flow) {
            this.isInput = isInput;
            this.flow = flow;
        }
    }

    // This is the top-level object for each item in the inventory list
    public static class InventoryFlowDTO {
        public BigDecimal amount;
        public EnviFlowDTO enviFlow;
        public InventoryFlowDTO(BigDecimal amount, EnviFlowDTO enviFlow) {
            this.amount = amount;
            this.enviFlow = enviFlow;
        }
    }

    public static class ImpactResultDTO {
        public String name;
        public BigDecimal amount;
        public String refUnit;
        public ImpactResultDTO(String name, BigDecimal amount, String refUnit) {
            this.name = name;
            this.amount = amount;
            this.refUnit = refUnit;
        }
    }

    public static class FullAnalyticsDTO {
        public Long productId;
        public List<InventoryFlowDTO> inventory;
        public List<ImpactResultDTO> fullImpacts;
        public FullAnalyticsDTO(Long productId, List<InventoryFlowDTO> inventory, List<ImpactResultDTO> fullImpacts) {
            this.productId = productId;
            this.inventory = inventory;
            this.fullImpacts = fullImpacts;
        }
    }

    @GetMapping("/calculated-products")
    public List<CalculatedProductDTO> getCalculatedProducts() {
        return inventoryItemRepository.findAll().stream()
                .filter(item -> item.getClimateChangeImpact() != null && item.getProduct() != null)
                .map(InventoryItem::getProduct)
                .distinct()
                .map(product -> new CalculatedProductDTO(product.getId(), product.getName(), "success"))
                .collect(Collectors.toList());
    }

    @GetMapping("/results/product/{productId}")
    @Transactional(readOnly = true)
    public ResponseEntity<FullAnalyticsDTO> getProductAnalytics(@PathVariable Long productId) {
        log.info("Fetching analytics for Product ID: {}", productId);
        Optional<Calculation> latestCalculationOpt = calculationRepository.findFirstByProductIdOrderByCreatedAtDesc(productId);

        if (latestCalculationOpt.isEmpty()) {
            log.warn("No calculation data found for product ID: {}", productId);
            return ResponseEntity.notFound().build();
        }
        Calculation calc = latestCalculationOpt.get();

        // **FIX**: Build the nested DTO structure
        List<InventoryFlowDTO> inventoryFlows = calc.getFlows().stream()
                .map(flow -> {
                    FlowDetailsDTO flowDetails = new FlowDetailsDTO(flow.getName(), flow.getCategory(), flow.getUnit());
                    EnviFlowDTO enviFlow = new EnviFlowDTO(flow.isInput(), flowDetails);
                    return new InventoryFlowDTO(flow.getAmount(), enviFlow);
                })
                .collect(Collectors.toList());

        List<ImpactResultDTO> impactResults = calc.getImpacts().stream()
                .map(impact -> new ImpactResultDTO(impact.getCategoryName(), impact.getAmount(), impact.getUnit()))
                .collect(Collectors.toList());

        FullAnalyticsDTO dto = new FullAnalyticsDTO(productId, inventoryFlows, impactResults);
        return ResponseEntity.ok(dto);
    }

    @Async
    @Transactional
    @PostMapping("/calculate/{inventoryItemId}")
    public void calculateLcaAndSave(@PathVariable Long inventoryItemId) {
        try {
            log.info("Starting LCA calculation for item ID: {}", inventoryItemId);
            Optional<InventoryItem> itemOpt = inventoryItemRepository.findById(inventoryItemId);
            if (itemOpt.isEmpty()) {
                log.error("Calculation failed: Inventory Item ID {} not found.", inventoryItemId);
                return;
            }
            InventoryItem item = itemOpt.get();
            Product product = item.getProduct();
            Thread.sleep(ThreadLocalRandom.current().nextInt(2000, 4000));
            Calculation newCalc = new Calculation(product);
            newCalc.addFlow(new Flow(newCalc, "Electricity, grid mix", "Energy", new BigDecimal("12.5"), "kWh", true));
            newCalc.addFlow(new Flow(newCalc, "Steel, low-alloyed", "Materials", new BigDecimal("1.2"), "kg", true));
            newCalc.addFlow(new Flow(newCalc, "Carbon dioxide", "Emissions to air", new BigDecimal("7.8"), "kg", false));
            newCalc.addFlow(new Flow(newCalc, "Wastewater", "Emissions to water", new BigDecimal("0.5"), "m³", false));
            BigDecimal climateChangeAmount = new BigDecimal("7.8").add(BigDecimal.valueOf(ThreadLocalRandom.current().nextDouble(0.1, 0.5)));
            newCalc.addImpact(new Impact(newCalc, "Climate change", climateChangeAmount, "kg CO2-eq"));
            newCalc.addImpact(new Impact(newCalc, "Ozone depletion", new BigDecimal("0.000012"), "kg CFC-11-eq"));
            newCalc.addImpact(new Impact(newCalc, "Freshwater ecotoxicity", new BigDecimal("1.5"), "PAF m³ day"));
            newCalc.addImpact(new Impact(newCalc, "Water use", new BigDecimal("0.75"), "m³"));
            calculationRepository.save(newCalc);
            item.setClimateChangeImpact(climateChangeAmount);
            item.setImpactUnit("kg CO2-eq");
            inventoryItemRepository.save(item);
            log.info("Finished and saved LCA calculation for product ID: {}", product.getId());
        } catch (InterruptedException e) {
            log.error("LCA calculation for item ID {} was interrupted.", inventoryItemId);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("LCA calculation failed for item ID {}: {}", inventoryItemId, e.getMessage(), e);
        }
    }
}