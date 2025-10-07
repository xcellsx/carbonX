def get_emission_factor(category: str):
    mock_data = {
        "transport": {"factor": 1.25, "unit": "kg CO2e/km"},
        "energy": {"factor": 0.45, "unit": "kg CO2e/kWh"},
        "materials": {"factor": 2.75, "unit": "kg CO2e/kg"},
    }
    return mock_data.get(category.lower(), {"error": "Category not found"})
