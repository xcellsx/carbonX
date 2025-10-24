package com.carbonx.lca.web;

import com.carbonx.lca.dto.FullAnalyticsDTO;
import com.carbonx.lca.service.LcaService;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/lca")
public class LcaController {

    private final LcaService lcaService;

    public LcaController(LcaService lcaService) {
        this.lcaService = lcaService;
    }

    @GetMapping("/analytics/{id}")
    public FullAnalyticsDTO getAnalyticsForProduct(@PathVariable UUID id) throws IOException {
        return lcaService.getAnalyticsForProduct(id);
    }
}