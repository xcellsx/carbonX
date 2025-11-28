package com.ecapybara.carbonx.repository;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.Company;

import java.util.List;
import java.util.Optional; // Import Optional

public interface CompanyInfoRepository extends ArangoRepository<Company, Long> {
    
    // --- ADD THIS METHOD ---
    // This allows us to find an existing entry by the user's ID
    Optional<Company> findByUserId(String userId);

    List<Company> findAll();
}