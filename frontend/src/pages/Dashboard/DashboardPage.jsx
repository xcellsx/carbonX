import React, { useState, useEffect, useRef } from 'react';
import './DashboardPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import ProModal from '../../components/ProModal/ProModal';
import AIChatPopup from '../../components/AIChatPopup/AIChatPopup';
import {
  Utensils, Leaf, Droplet, ArrowRight, Zap, X,
  Sparkles, CircleCheck, ShieldUser, Wheat, Earth, Dna, Plus,
  Database, Car, Recycle, ShieldAlert, HeartPulse, Tags, Users, Globe, Lock,
  Factory, ChevronLeft, ChevronRight, LayoutDashboard, Wind, Scale, AlertTriangle, Plane
} from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { API_BASE } from '../../services/api';
import { chatCompletion } from '../../services/openRouter';
import { useProSubscription } from '../../hooks/useProSubscription';

const allMetricDefinitions = [
  { id: 'scope-1', name: 'Scope 1 Emissions', icon: Factory }, 
  { id: 'scope-2', name: 'Scope 2 Emissions', icon: Zap },     
  { id: 'fleet-fuel-management', name: 'Fleet Fuel Management', icon: Car },
  { id: 'energy-management', name: 'Energy Management', icon: Zap },
  { id: 'food-waste-management', name: 'Food Waste Management', icon: Recycle },
  { id: 'data-security', name: 'Data Security', icon: ShieldAlert },
  { id: 'food-safety', name: 'Food Safety', icon: Utensils },
  { id: 'product-health-nutrition', name: 'Product Health & Nutrition', icon: HeartPulse },
  { id: 'product-labelling-marketing', name: 'Product Labelling & Marketing', icon: Tags },
  { id: 'labour-practices', name: 'Labour Practices', icon: Users },
  { id: 'supply-chain-impacts', name: 'Management of Env. & Social Impacts', icon: Globe },
  { id: 'gmo', name: 'GMO Management', icon: Dna, isPro: true }, 
  // Transport / Marine Transportation metrics
  { id: 'transport-ghg', name: 'Greenhouse Gas Emissions', icon: Factory },
  { id: 'transport-air-quality', name: 'Air Quality', icon: Wind },
  { id: 'transport-ecological', name: 'Ecological Impacts', icon: Leaf },
  { id: 'transport-customer-safety', name: 'Customer Health & Safety', icon: ShieldUser },
  { id: 'transport-business-ethics', name: 'Business Ethics', icon: Scale },
  { id: 'transport-workforce-safety', name: 'Workforce Health & Safety', icon: Users },
  { id: 'transport-accident-safety', name: 'Accident & Safety Management', icon: AlertTriangle },
  // Transport / Airlines (planes) metrics
  { id: 'airlines-ghg', name: 'Greenhouse Gas Emissions', icon: Plane },
  { id: 'airlines-air-quality', name: 'Air Quality', icon: Wind },
  { id: 'airlines-ecological', name: 'Ecological Impacts', icon: Leaf },
  { id: 'airlines-customer-safety', name: 'Customer Health & Safety', icon: ShieldUser },
  { id: 'airlines-business-ethics', name: 'Business Ethics', icon: Scale },
  { id: 'airlines-workforce-safety', name: 'Workforce Health & Safety', icon: Users },
  { id: 'airlines-accident-safety', name: 'Accident & Safety Management', icon: AlertTriangle },
];

const ALL_METRIC_DATA_DEFINITIONS = {
  'SCOPE_1': { value: 120.50, unit: 'kgCO2e', decimals: 2 }, 
  'SCOPE_2': { value: 85.20, unit: 'kgCO2e', decimals: 2 },  
  
  'TOTAL_GHG': { defaultMax: 100000, decimals: 3, unit: 'kgCO2e' },
  'CALC_TRANSPORT_GHG': { defaultMax: 50000, decimals: 3, unit: 'kgCO2e' },
  
  'FB-FR-130a.1': { defaultMax: 50000.0, decimals: 2, unit: 'Gigajoules (GJ)' },
  'FB-FR-110a.1': { defaultMax: 10000.0, decimals: 2, unit: 'Gigajoules (GJ)' },

  // Metrics needing User Input
  'FB-FR-250a.1': { staticValue: 'User Input', unit: 'Metric tonnes (t)' },
  
  // --- SPECIFIC UNITS ---
  'FB-FR-230a.1': { staticValue: 'User Input', unit: 'Data Breach' }, 
  'FB-FR-230a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-230a.3': { staticValue: 'User Input', unit: '' }, // Qualitative
  
  'FB-FR-250b.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-250b.2': { staticValue: 'User Input', unit: 'Recalls' }, 
  'FB-FR-250b.3': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-260a.1': { staticValue: 'User Input', unit: '' }, // Qualitative
  'FB-FR-260a.2': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-270a.1': { staticValue: 'User Input', unit: 'Incidents' }, 
  'FB-FR-270a.2': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-330a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.2': { staticValue: 'User Input', unit: '/ hour' }, 
  'FB-FR-330a.3': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.4': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.5': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.6': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-430a.1': { staticValue: 'User Input', unit: '$' }, 
  'FB-FR-430a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-430a.3': { staticValue: 'User Input', unit: '' }, // Qualitative
  'FB-FR-430a.4': { staticValue: 'User Input', unit: '' }, // Qualitative
  
  'FB-FR-430b.1': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },

  // --- Transport / Marine Transportation metrics ---
  'TR-MR-GHG-1': { staticValue: 'User Input', unit: 'kgCO2e' },
  'TR-MR-GHG-2': { staticValue: 'User Input', unit: '' }, // Discussion and Analysis
  'TR-MR-GHG-3a': { staticValue: 'User Input', unit: 'GJ' },
  'TR-MR-GHG-3b': { staticValue: 'User Input', unit: '% heavy fuel oil' },
  'TR-MR-GHG-3c': { staticValue: 'User Input', unit: '% renewable' },
  'TR-MR-GHG-4': { staticValue: 'User Input', unit: 'EEDI' },
  'TR-MR-AQ-1': { staticValue: 'User Input', unit: 'NOx, SOx, PM10' },
  'TR-MR-ECOL-1': { staticValue: 'User Input', unit: 'hours' },
  'TR-MR-ECOL-2': { staticValue: 'User Input', unit: '% fleet' },
  'TR-MR-ECOL-3': { staticValue: 'User Input', unit: 'number / volume' },
  'TR-MR-CHS-1': { staticValue: 'User Input', unit: 'incidents' },
  'TR-MR-CHS-2': { staticValue: 'User Input', unit: '%' },
  'TR-MR-CHS-3': { staticValue: 'User Input', unit: 'per million / voyages' },
  'TR-MR-BE-1': { staticValue: 'User Input', unit: 'port calls' },
  'TR-MR-BE-2': { staticValue: 'User Input', unit: '$' },
  'TR-MR-WHS-1': { staticValue: 'User Input', unit: 'LTIR' },
  'TR-MR-ASM-1': { staticValue: 'User Input', unit: 'casualties' },
  'TR-MR-ASM-2': { staticValue: 'User Input', unit: 'conditions' },
  'TR-MR-ASM-3': { staticValue: 'User Input', unit: 'deficiencies / detentions' },

  // --- Transport / Airlines (planes) metrics ---
  'TR-AR-GHG-1': { staticValue: 'User Input', unit: 'kgCO2e' },
  'TR-AR-GHG-2': { staticValue: 'User Input', unit: '' },
  'TR-AR-GHG-3a': { staticValue: 'User Input', unit: 'GJ' },
  'TR-AR-GHG-4': { staticValue: 'User Input', unit: 'e.g. kg CO2/RPK' },
  'TR-AR-AQ-1': { staticValue: 'User Input', unit: 'NOx, SOx, PM' },
  'TR-AR-ECOL-1': { staticValue: 'User Input', unit: 'hours' },
  'TR-AR-ECOL-2': { staticValue: 'User Input', unit: '% fleet' },
  'TR-AR-CHS-1': { staticValue: 'User Input', unit: 'incidents' },
  'TR-AR-CHS-2': { staticValue: 'User Input', unit: '%' },
  'TR-AR-BE-1': { staticValue: 'User Input', unit: 'flights' },
  'TR-AR-BE-2': { staticValue: 'User Input', unit: '$' },
  'TR-AR-WHS-1': { staticValue: 'User Input', unit: 'LTIR' },
  'TR-AR-ASM-1': { staticValue: 'User Input', unit: 'incidents' },
  'TR-AR-ASM-2': { staticValue: 'User Input', unit: 'findings' },
};

const METRIC_BREAKDOWN_DATA = {
  'scope-1': {
    title: 'Scope 1 Emissions', icon: Factory,
    subMetrics: [
      { 
        name: 'Direct Emissions from Owned Sources', 
        type: 'Quantitative', 
        dataKey: 'SCOPE_1', 
        sasbCategory: 'GHG Emissions',
        proContent: 'Analysis: Your stationary combustion emissions are stable. Switching your boiler fuel from diesel to natural gas or biomass could reduce this by up to 30%. We recommend conducting a feasibility study on electrification for heating processes.'
      },
      { name: 'Source', type: 'Info', value: 'Calculated from fuel consumption data entered in Inventory.' }
    ]
  },
  'scope-2': {
    title: 'Scope 2 Emissions', icon: Zap,
    subMetrics: [
      { 
        name: 'Indirect Emissions from Purchased Energy', 
        type: 'Quantitative', 
        dataKey: 'SCOPE_2', 
        sasbCategory: 'GHG Emissions',
        proContent: 'Analysis: Electricity consumption spikes during midday processing. Installing on-site solar panels or purchasing RECs (Renewable Energy Certificates) is recommended to offset this carbon load and stabilize long-term energy costs.'
      },
      { name: 'Source', type: 'Info', value: 'Calculated from purchased electricity entries in Inventory.' }
    ]
  },
  'fleet-fuel-management': {
    title: 'Fleet Fuel Management', icon: Car,
    subMetrics: [
      { 
        name: 'Calculated Transport Emissions', 
        type: 'Quantitative', 
        dataKey: 'CALC_TRANSPORT_GHG', 
        sasbCategory: 'Inventory Calculation',
        proContent: 'Analysis: Transport emissions contribute significantly to your Scope 1 footprint. Optimizing delivery routes and consolidating shipments can yield a 10-15% reduction in fuel usage immediately.'
      },
      { 
        name: 'Fleet fuel consumed, percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-110a.1', 
        sasbCategory: 'Transport & Energy Management',
        proContent: 'Analysis: Current renewable fuel blend is 0%. We strongly advise transitioning to B20 biodiesel for the fleet, which requires no engine modifications but immediately lowers carbon intensity.'
      },
    ]
  },
  'energy-management': {
    title: 'Energy Management', icon: Zap,
    subMetrics: [
      { 
        name: '(1) Operational energy consumed, (2) percentage grid electricity', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.1',
        sasbCategory: 'Energy Management',
        proContent: 'Analysis: Energy intensity per product unit has increased slightly. Conduct a Level 2 energy audit of the drying equipment; retrofitting with waste heat recovery pumps could improve thermal efficiency by 20%.'
      },
    ]
  },
  'food-waste-management': {
    title: 'Food Waste Management', icon: Recycle,
    subMetrics: [
      { 
        name: '(1) Amount of food waste generated', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250a.1',
        sasbCategory: 'Waste Management',
        proContent: 'Analysis: Organic waste is currently sent to landfill, generating unnecessary methane. Partnering with a local anaerobic digestion or composting facility could divert 90% of this stream and contribute to circular economy goals.'
      },
    ]
  },
  'data-security': {
    title: 'Data Security', icon: ShieldAlert,
    subMetrics: [
      { 
        name: 'Number of data breaches', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-230a.1',
        sasbCategory: 'Customer Privacy',
        proContent: 'Analysis: No breaches recorded in the current period. Continue quarterly vulnerability scans and employee phishing simulations to maintain this status.'
      },
      { 
        name: 'Description of approach for addressing data security risks', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-230a.3',
        sasbCategory: 'Customer Privacy',
        proContent: 'Analysis: We recommend adopting a defense-in-depth strategy. This includes encrypting all sensitive data at rest and in transit, enforcing Multi-Factor Authentication (MFA) for all access points, and conducting regular third-party penetration testing to validate the resilience of your internal systems against evolving cyber threats.'
      },
    ]
  },
  'food-safety': {
    title: 'Food Safety', icon: Utensils,
    subMetrics: [
      { 
        name: 'Number of recalls', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.2',
        sasbCategory: 'Product Safety',
        proContent: 'Analysis: Zero recalls achieved. To sustain this, focus on preventative maintenance of detection equipment (metal detectors/X-ray) and regular mock recall drills.'
      },
      { 
        name: 'Fines and warning rate', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.1',
        sasbCategory: 'Product Safety',
        proContent: 'Analysis: Maintain current HACCP protocols. We recommend reviewing supplier safety certifications annually to ensure upstream compliance does not compromise your safety rating.'
      },
    ]
  },
  'product-health-nutrition': {
    title: 'Product Health & Nutrition', icon: HeartPulse,
    subMetrics: [
      { 
        name: 'Discussion of process to manage nutritional concerns', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-260a.1',
        sasbCategory: 'Product Health & Nutrition',
        proContent: 'Analysis: To mitigate health-related risks and align with consumer trends, we advise implementing a rigorous stage-gate process for new products. This involves mandatory nutritional profiling against WHO guidelines and establishing a clear roadmap for sodium and sugar reduction across your legacy portfolio.'
      },
    ]
  },
  'product-labelling-marketing': {
    title: 'Product Labelling & Marketing', icon: Tags,
    subMetrics: [
      { 
        name: 'Incidents of non-compliance with labelling regulations', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-270a.1',
        sasbCategory: 'Labelling & Marketing',
        proContent: 'Analysis: Regulatory scrutiny on "greenwashing" is intensifying. We advise a comprehensive audit of all sustainability claims on packaging against the latest EU directives and FTC Green Guides. Establishing a legal review step for all marketing materials is essential.'
      },
    ]
  },
  'labour-practices': {
    title: 'Labour Practices', icon: Users,
    subMetrics: [
      { 
        name: 'Average hourly wage', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.2',
        sasbCategory: 'Wages & Benefits',
        proContent: 'Analysis: Wage levels are competitive within the sector. To improve retention, focus on non-monetary benefits such as flexible scheduling and structured upskilling programs.'
      },
    ]
  },
  'supply-chain-impacts': {
    title: 'Management of Env. & Social Impacts', icon: Globe,
    subMetrics: [
      { 
        name: 'Revenue from sustainable sourcing', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430a.1',
        sasbCategory: 'Supply-Chain Management',
        proContent: 'Analysis: Increasing certified sustainable ingredients (e.g., Fair Trade, Rainforest Alliance) can significantly improve brand equity. We recommend setting a target of 50% certified sourcing by 2027 to enhance supply chain resilience.'
      },
      { 
        name: 'Strategy to manage env. & social risks', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-430a.3',
        sasbCategory: 'Supply-Chain Management',
        proContent: 'Analysis: Sustainable supply chain management requires end-to-end visibility. We suggest prioritizing the mapping of Tier 1 and Tier 2 suppliers to identify environmental hotspots. Concurrently, enforce a Supplier Code of Conduct that mandates compliance with labor laws and zero-deforestation policies, verified through annual third-party audits.'
      },
    ]
  },
  'gmo': {
    title: 'GMO Management', icon: Dna,
    subMetrics: [
      { 
        name: 'Revenue from GMO products', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430b.1',
        sasbCategory: 'Product Sourcing',
        proContent: 'Analysis: Non-GMO demand is rising in key export markets (EU/Japan). Consider obtaining Non-GMO Project verification for your flagship products to access these premium segments.'
      },
    ]
  },

  // --- Transport / Marine Transportation (sector: Transportation, industry: Marine Transportation) ---
  'transport-ghg': {
    title: 'Greenhouse Gas Emissions', icon: Factory,
    subMetrics: [
      { name: 'Gross Global Scope 1 emissions', type: 'Quantitative', dataKey: 'TR-MR-GHG-1', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Scope 1 from marine operations. Consider fuel switching and efficiency measures to meet reduction targets.' },
      { name: 'Discussion of long-term and short-term strategy or plan to manage Scope 1 emissions, emissions reduction targets and an analysis of performance against those targets', type: 'Discussion and Analysis', dataKey: 'TR-MR-GHG-2', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Document a clear roadmap with near-term and long-term targets aligned with IMO ambitions.' },
      { name: '(1) Total energy consumed (2) percentage heavy fuel oil, and percentage renewable', type: 'Quantitative', dataKey: 'TR-MR-GHG-3a', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Track energy mix to identify decarbonisation levers.' },
      { name: 'Average Energy Efficiency Design Index (EEDI)', type: 'Quantitative', dataKey: 'TR-MR-GHG-4', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: EEDI improvement supports compliance and fuel savings.' },
    ]
  },
  'transport-air-quality': {
    title: 'Air Quality', icon: Wind,
    subMetrics: [
      { name: 'Air emissions of the following pollutants: (1) NOx (excluding N2O), (2) SOx and (3) particulate matter (PM10)', type: 'Quantitative', dataKey: 'TR-MR-AQ-1', sasbCategory: 'Air Quality', proContent: 'Analysis: Monitor NOx, SOx and PM10 to align with emission control areas and port requirements.' },
    ]
  },
  'transport-ecological': {
    title: 'Ecological Impacts', icon: Leaf,
    subMetrics: [
      { name: 'Shipping duration in marine protected areas or areas of protected conservation status', type: 'Quantitative', dataKey: 'TR-MR-ECOL-1', sasbCategory: 'Ecological Impacts', proContent: 'Analysis: Track time in sensitive areas to manage biodiversity and reputational risk.' },
      { name: 'Percentage of fleet implementing ballast water (1) exchange and (2) treatment', type: 'Quantitative', dataKey: 'TR-MR-ECOL-2', sasbCategory: 'Ecological Impacts', proContent: 'Analysis: Ballast water management supports regulatory compliance and invasive species control.' },
      { name: 'Number and aggregated volume of spills and releases to the environment', type: 'Quantitative', dataKey: 'TR-MR-ECOL-3', sasbCategory: 'Ecological Impacts', proContent: 'Analysis: Zero spill targets and response readiness reduce environmental and liability risk.' },
    ]
  },
  'transport-customer-safety': {
    title: 'Customer Health & Safety', icon: ShieldUser,
    subMetrics: [
      { name: 'Number of alleged crime incidents involving passengers or employees', type: 'Quantitative', dataKey: 'TR-MR-CHS-1', sasbCategory: 'Customer Health & Safety', proContent: 'Analysis: Security protocols and reporting support passenger and crew safety.' },
      { name: 'Percentage of fleet inspections failed', type: 'Quantitative', dataKey: 'TR-MR-CHS-2', sasbCategory: 'Customer Health & Safety', proContent: 'Analysis: Reduce failed inspections through preventive maintenance and crew training.' },
      { name: '(1) Serious injuries per million passengers and (2) number of voyages with a gastrointestinal illness count exceeding 25', type: 'Quantitative', dataKey: 'TR-MR-CHS-3', sasbCategory: 'Customer Health & Safety', proContent: 'Analysis: Track leading indicators to improve health and safety outcomes.' },
    ]
  },
  'transport-business-ethics': {
    title: 'Business Ethics', icon: Scale,
    subMetrics: [
      { name: 'Number of calls at ports in the countries that have the 20 lowest rankings in Transparency International\'s Corruption Perception Index', type: 'Quantitative', dataKey: 'TR-MR-BE-1', sasbCategory: 'Business Ethics', proContent: 'Analysis: Monitor port exposure to high-corruption jurisdictions and strengthen due diligence.' },
      { name: 'Total amount of monetary losses as a result of legal proceedings associated with bribery or corruption', type: 'Quantitative', dataKey: 'TR-MR-BE-2', sasbCategory: 'Business Ethics', proContent: 'Analysis: Robust anti-bribery policies and training reduce legal and reputational risk.' },
    ]
  },
  'transport-workforce-safety': {
    title: 'Workforce Health & Safety', icon: Users,
    subMetrics: [
      { name: 'Lost time incident rate (LTIR)', type: 'Quantitative', dataKey: 'TR-MR-WHS-1', sasbCategory: 'Workforce Health & Safety', proContent: 'Analysis: LTIR trends indicate effectiveness of safety programmes and training.' },
    ]
  },
  'transport-accident-safety': {
    title: 'Accident & Safety Management', icon: AlertTriangle,
    subMetrics: [
      { name: '(1) Number of marine casualties, (2) percentage classified as very serious', type: 'Quantitative', dataKey: 'TR-MR-ASM-1', sasbCategory: 'Accident & Safety Management', proContent: 'Analysis: Root cause analysis and lessons learned support continuous improvement.' },
      { name: 'Number of conditions of Class or Recommendations', type: 'Quantitative', dataKey: 'TR-MR-ASM-2', sasbCategory: 'Accident & Safety Management', proContent: 'Analysis: Address class conditions promptly to maintain vessel eligibility and safety.' },
      { name: 'Number of port state control (1) deficiencies and (2) detentions', type: 'Quantitative', dataKey: 'TR-MR-ASM-3', sasbCategory: 'Accident & Safety Management', proContent: 'Analysis: Minimise PSC findings through proactive maintenance and compliance.' },
    ]
  },

  // --- Transport / Airlines (planes) - sector: Transportation, industry: Airlines ---
  'airlines-ghg': {
    title: 'Greenhouse Gas Emissions', icon: Plane,
    subMetrics: [
      { name: 'Gross Global Scope 1 emissions (aviation fuel)', type: 'Quantitative', dataKey: 'TR-AR-GHG-1', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Scope 1 from aircraft operations. Consider SAF blend and fleet renewal to meet CORSIA and net-zero targets.' },
      { name: 'Discussion of strategy and targets for Scope 1 emissions and performance', type: 'Discussion and Analysis', dataKey: 'TR-AR-GHG-2', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Align roadmap with ICAO CORSIA and science-based targets.' },
      { name: 'Total energy consumed and percentage renewable / SAF', type: 'Quantitative', dataKey: 'TR-AR-GHG-3a', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Track SAF uptake and energy efficiency (e.g. kg CO2/RPK).' },
      { name: 'Fuel efficiency (e.g. kg CO2 per revenue passenger-km)', type: 'Quantitative', dataKey: 'TR-AR-GHG-4', sasbCategory: 'Greenhouse Gas Emissions', proContent: 'Analysis: Fleet and operational efficiency drive emissions intensity.' },
    ]
  },
  'airlines-air-quality': {
    title: 'Air Quality', icon: Wind,
    subMetrics: [
      { name: 'Air emissions: NOx, SOx, particulate matter (ground and cruise)', type: 'Quantitative', dataKey: 'TR-AR-AQ-1', sasbCategory: 'Air Quality', proContent: 'Analysis: Monitor NOx and PM to align with airport and ICAO standards.' },
    ]
  },
  'airlines-ecological': {
    title: 'Ecological Impacts', icon: Leaf,
    subMetrics: [
      { name: 'Aircraft operations in or near protected/sensitive areas', type: 'Quantitative', dataKey: 'TR-AR-ECOL-1', sasbCategory: 'Ecological Impacts', proContent: 'Analysis: Track exposure to sensitive habitats and noise-sensitive areas.' },
      { name: 'Percentage of fleet with noise and emissions certifications (e.g. Chapter 14)', type: 'Quantitative', dataKey: 'TR-AR-ECOL-2', sasbCategory: 'Ecological Impacts', proContent: 'Analysis: Fleet modernisation reduces noise and local emissions.' },
    ]
  },
  'airlines-customer-safety': {
    title: 'Customer Health & Safety', icon: ShieldUser,
    subMetrics: [
      { name: 'Number of alleged security or safety incidents involving passengers or crew', type: 'Quantitative', dataKey: 'TR-AR-CHS-1', sasbCategory: 'Customer Health & Safety', proContent: 'Analysis: Security and cabin safety protocols support passenger and crew welfare.' },
      { name: 'Percentage of fleet or audits failing safety/security inspections', type: 'Quantitative', dataKey: 'TR-AR-CHS-2', sasbCategory: 'Customer Health & Safety', proContent: 'Analysis: Reduce findings through preventive maintenance and training.' },
    ]
  },
  'airlines-business-ethics': {
    title: 'Business Ethics', icon: Scale,
    subMetrics: [
      { name: 'Operations in high-corruption-risk jurisdictions (e.g. low CPI)', type: 'Quantitative', dataKey: 'TR-AR-BE-1', sasbCategory: 'Business Ethics', proContent: 'Analysis: Monitor exposure and strengthen due diligence and anti-bribery controls.' },
      { name: 'Monetary losses from legal proceedings (bribery/corruption)', type: 'Quantitative', dataKey: 'TR-AR-BE-2', sasbCategory: 'Business Ethics', proContent: 'Analysis: Robust compliance programmes reduce legal and reputational risk.' },
    ]
  },
  'airlines-workforce-safety': {
    title: 'Workforce Health & Safety', icon: Users,
    subMetrics: [
      { name: 'Lost time incident rate (LTIR) – ground and flight crew', type: 'Quantitative', dataKey: 'TR-AR-WHS-1', sasbCategory: 'Workforce Health & Safety', proContent: 'Analysis: LTIR trends indicate effectiveness of safety and fatigue management.' },
    ]
  },
  'airlines-accident-safety': {
    title: 'Accident & Safety Management', icon: AlertTriangle,
    subMetrics: [
      { name: 'Number of accidents/incidents and percentage classified as serious', type: 'Quantitative', dataKey: 'TR-AR-ASM-1', sasbCategory: 'Accident & Safety Management', proContent: 'Analysis: Learning from incidents supports continuous safety improvement.' },
      { name: 'Number of regulatory or audit findings (e.g. IOSA, state authority)', type: 'Quantitative', dataKey: 'TR-AR-ASM-2', sasbCategory: 'Accident & Safety Management', proContent: 'Analysis: Address findings promptly to maintain operating authority.' },
    ]
  },
};

const DASHBOARD_CAROUSEL_SLIDES = [
  { title: 'Welcome to the Dashboard', description: 'Your sustainability metrics at a glance. The dashboard shows key ESG and carbon metrics (Scope 1 & 2, energy, waste, supply chain, and more) based on your inventory and local data.', icon: <LayoutDashboard size={40} /> },
  { title: 'Metric cards', description: 'Click a metric card to expand and see its breakdown. Each metric can have sub-metrics, targets, and a Pro Insight section with AI-generated analysis when available.', icon: <Database size={40} /> },
  { title: 'Pro Insight & AI', description: 'Pro users get AI-generated insights at the top of the breakdown. You can also open the chat popup (sparkles button) to ask questions about your dashboard or get a summary.', icon: <Sparkles size={40} /> },
];

const generateInitialMetrics = () => {
  const data = {};
  for (const key in ALL_METRIC_DATA_DEFINITIONS) {
    const def = ALL_METRIC_DATA_DEFINITIONS[key];
    data[key] = { 
      value: def.value !== undefined ? def.value : (def.staticValue || null), 
      unit: def.unit, 
      decimals: def.decimals 
    };
  }
  return data;
};

const DashboardPage = () => {
  const { isProUser } = useProSubscription(); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [metrics, setMetrics] = useState(null); 
  const [showProModal, setShowProModal] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState(null);
  const [hasProducts, setHasProducts] = useState(false);
  const [proInsightText, setProInsightText] = useState('');
  const [proInsightLoading, setProInsightLoading] = useState(false);
  const [proInsightError, setProInsightError] = useState('');
  
  const metricsScrollRef = useRef(null);
  const proInsightReqKeyRef = useRef('');
  const proInsightDebounceRef = useRef(null);

  const scrollMetrics = (direction) => {
    if (metricsScrollRef.current) {
      const scrollAmount = 300; 
      metricsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMetricValueChange = (dataKey, newValue) => {
    setMetrics(prev => {
      if (!prev) return prev;
      const updatedData = { ...prev.data };
      
      if (updatedData[dataKey]) {
        updatedData[dataKey] = { 
          ...updatedData[dataKey], 
          value: newValue 
        };
      }
      localStorage.setItem('carbonx_dashboard_metrics', JSON.stringify(updatedData));
      return { ...prev, data: updatedData };
    });
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      navigate('/signup'); 
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        // Product count: optional backend; metrics are no longer stored in the backend
        let productCount = 0;
        try {
          const productsRes = await fetch(`${API_BASE}/products`);
          if (productsRes.ok) {
            const body = await productsRes.json();
            const list = Array.isArray(body) ? body : body?.content ?? body?.data ?? [];
            productCount = Array.isArray(list) ? list.length : 0;
          }
        } catch (_) {
          // Backend/products unavailable – dashboard still works with local metrics
        }
        const hasAnyProducts = productCount > 0;
        setHasProducts(hasAnyProducts);

        let baseData = generateInitialMetrics();
        const savedMetricsStr = localStorage.getItem('carbonx_dashboard_metrics');
        if (savedMetricsStr) {
          try {
            const savedMetrics = JSON.parse(savedMetricsStr);
            Object.keys(savedMetrics).forEach(key => {
              if (baseData[key] && savedMetrics[key]?.value !== undefined) {
                baseData[key].value = savedMetrics[key].value;
              }
            });
          } catch (e) {
            console.error("Failed to load saved metrics", e);
          }
        } else {
          // Defaults when no saved metrics (no backend-derived values)
          if (baseData['FB-FR-130a.1']) baseData['FB-FR-130a.1'].value = "1.00";
        }

        // If there are no products, show zeros instead of demo defaults.
        // (User can still edit values; edits persist via carbonx_dashboard_metrics.)
        if (!hasAnyProducts) {
          Object.keys(baseData).forEach((k) => {
            const v = baseData[k]?.value;
            if (v === null || v === undefined || v === '' || v === 'User Input') {
              baseData[k].value = 0;
              return;
            }
            if (typeof v === 'number') {
              baseData[k].value = 0;
              return;
            }
            if (typeof v === 'string' && !Number.isNaN(Number(v))) {
              baseData[k].value = 0;
            }
          });
        }

        const standardList = [
          "scope-1",
          "scope-2",
          "fleet-fuel-management",
          "energy-management",
          "food-waste-management",
          "data-security",
          "food-safety",
          "product-health-nutrition",
          "product-labelling-marketing",
          "labour-practices",
          "supply-chain-impacts",
          "gmo"
        ];

        const marineTransportList = [
          "transport-ghg",
          "transport-air-quality",
          "transport-ecological",
          "transport-customer-safety",
          "transport-business-ethics",
          "transport-workforce-safety",
          "transport-accident-safety",
        ];

        const airlinesList = [
          "airlines-ghg",
          "airlines-air-quality",
          "airlines-ecological",
          "airlines-customer-safety",
          "airlines-business-ethics",
          "airlines-workforce-safety",
          "airlines-accident-safety",
        ];

        const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
        const storageKey = currentUserId.includes('/') ? currentUserId.split('/').pop() : currentUserId;
        const userCompany = allCompanyData[currentUserId] ?? allCompanyData[storageKey] ?? null;
        const sector = (userCompany?.sector || '').trim();
        const industry = (userCompany?.industry || '').trim();

        const isFnb = sector === 'Food & Beverages' || sector === 'FNB' || sector === 'F&B';
        const isMarineTransport = sector === 'Transportation' && industry === 'Marine Transportation';
        const isAirlines = sector === 'Transportation' && industry === 'Airlines';

        let metricList;
        if (isFnb) {
          metricList = standardList;
        } else if (isMarineTransport) {
          metricList = marineTransportList;
        } else if (isAirlines) {
          metricList = airlinesList;
        } else {
          metricList = standardList;
        }

        setMetrics({
          metricList,
          data: baseData,
          topContributors: [],
          sector: sector || null,
          industry: industry || null,
        });

        if (metricList.length > 0) {
          setActiveMetricId(prevId => (metricList.includes(prevId) ? prevId : metricList[0]));
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    fetchDashboardData();
  }, [navigate]);
  
  const handleSparkleClick = () => {
    if (isProUser) {
      setShowChatPopup(true);
    } else {
      setShowProModal(true);
    }
  };

  const activeBreakdownTemplate = activeMetricId ? METRIC_BREAKDOWN_DATA[activeMetricId] : null;

  // --- Real-time Pro Insight (AI generated) ---
  // Must be declared before any early return to avoid hook order errors.
  useEffect(() => {
    if (!isProUser) {
      setProInsightText('');
      setProInsightLoading(false);
      setProInsightError('');
      return;
    }
    if (!activeMetricId || !activeBreakdownTemplate || !metrics?.data) return;

    const snapshot = activeBreakdownTemplate.subMetrics
      .filter((s) => s && s.dataKey)
      .map((s) => {
        const d = metrics.data[s.dataKey];
        return {
          name: s.name,
          type: s.type,
          sasbCategory: s.sasbCategory || null,
          value: d?.value ?? null,
          unit: d?.unit ?? null,
        };
      });

    const reqKey = JSON.stringify({
      metricId: activeMetricId,
      snapshot,
    });

    if (reqKey === proInsightReqKeyRef.current) return;
    proInsightReqKeyRef.current = reqKey;

    if (proInsightDebounceRef.current) clearTimeout(proInsightDebounceRef.current);

    proInsightDebounceRef.current = setTimeout(async () => {
      const CACHE_KEY = 'carbonx_pro_insights_cache_v1';
      let cache = {};
      try {
        cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
      } catch (_) {}

      if (cache[reqKey]) {
        setProInsightText(cache[reqKey]);
        setProInsightLoading(false);
        setProInsightError('');
        return;
      }

      setProInsightLoading(true);
      setProInsightError('');

      const SYSTEM = `You are Sprout AI for CarbonX. Generate a concise, real-time \"Pro Insight\" based ONLY on the metric values provided. 
Return 2–4 short bullet points. Each bullet should be actionable and specific (e.g. what to investigate, what lever reduces emissions, what target to set). 
Do not mention that you are an AI. Do not ask questions. Do not include citations or links.`;

      const USER = `Metric: ${activeBreakdownTemplate.title}\n\nValues:\n${snapshot
        .map((x) => `- ${x.name}: ${x.value ?? 'N/A'}${x.unit ? ` ${x.unit}` : ''}`)
        .join('\n')}\n\nGenerate the Pro Insight bullets now.`;

      try {
        const reply = await chatCompletion(
          [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: USER },
          ],
          { max_tokens: 220, temperature: 0.4 }
        );
        const cleaned = (reply || '').trim();
        setProInsightText(cleaned);
        try {
          cache[reqKey] = cleaned;
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (_) {}
      } catch (e) {
        setProInsightError('Unable to generate Pro Insight right now.');
        setProInsightText('');
      } finally {
        setProInsightLoading(false);
      }
    }, 650);

    return () => {
      if (proInsightDebounceRef.current) clearTimeout(proInsightDebounceRef.current);
    };
  }, [isProUser, activeMetricId, activeBreakdownTemplate, metrics]);

  if (!metrics) {
    return (
      <div className="container">
        <Navbar />
        <div className="content-section-main">
          <div className="content-container-main" style={{ padding: '2rem' }}>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const metricsForIndustry = allMetricDefinitions.filter(m => 
    metrics.metricList.includes(m.id)
  );

  const getTopLevelData = (metricId) => {
    const breakdown = METRIC_BREAKDOWN_DATA[metricId];
    if (!breakdown || !metrics) return { displayValue: 'N/A', hasData: false };

    if (metricId === 'scope-1' || metricId === 'scope-2') {
        const key = metricId === 'scope-1' ? 'SCOPE_1' : 'SCOPE_2';
        const d = metrics.data[key];
        if(d) return { displayValue: `${d.value} ${d.unit}`, hasData: true };
    }

    // UPDATED: For Food Safety, use the Recalls metric (which has the unit)
    if (metricId === 'food-safety') {
      const metricData = metrics.data['FB-FR-250b.2']; // Recalls metric
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          return { displayValue: `${val} ${metricData.unit}`, hasData: true };
      }
    }

    if (metricId === 'fleet-fuel-management') {
      const metricData = metrics.data['CALC_TRANSPORT_GHG']; 
      if (metricData && metricData.value !== null && parseFloat(metricData.value) > 0) {
         return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
      }
      return { displayValue: 'N/A', hasData: false };
    }

    if (metricId === 'energy-management') {
        const metricData = metrics.data['FB-FR-130a.1'];
        if (metricData && metricData.value) {
            return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
        }
    }

    const firstQuantMetric = breakdown.subMetrics.find(sub => sub.type === 'Quantitative');
    if (firstQuantMetric) {
      const metricData = metrics.data[firstQuantMetric.dataKey];
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          // Check if currency unit ($)
          if (metricData.unit === '$') {
            return { displayValue: `${metricData.unit}${val}`, hasData: true };
          }
          return { displayValue: `${val} ${metricData.unit}`, hasData: true };
      }
    }
    
    const firstAnalysisMetric = breakdown.subMetrics.find(sub => sub.type === 'Discussion and Analysis');
    if (firstAnalysisMetric) {
       const metricData = metrics.data[firstAnalysisMetric.dataKey];
       if (metricData && metricData.value) {
         return { displayValue: metricData.value === 'User Input' ? 'Analysis' : metricData.value, hasData: true };
       }
    }
    
    return { displayValue: 'N/A', hasData: false };
  };

  return (
    <div className="container">
      <InstructionalCarousel pageId="dashboard" slides={DASHBOARD_CAROUSEL_SLIDES} newUserOnly />
      <Navbar />

      <div className="content-section-main">
        <div className="content-container-main"> 
          
          <div className="header-group">
            <h1>Dashboard</h1>
            <p className = "medium-regular">Overview of your industry metrics.</p>
          </div>
          
          <div className = "sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className = "header-col">
              <p className='descriptor-medium'>Key Metrics</p>
              {hasProducts ? (
                <p style = {{color: "rgba(var(--greys), 1)"}}>
                  {metrics?.sector
                    ? `Showing ${metricsForIndustry.length} metrics for ${metrics.sector}${metrics.industry ? ` · ${metrics.industry}` : ''}`
                    : `Showing ${metricsForIndustry.length} metrics`}
                </p>
              ) : (
                <p style = {{color: "rgba(var(--greys), 1)"}}>
                  No products added yet.
                </p>
              )}
            </div>
            <div className = "button-container">
              <button 
                className = "icon" 
                onClick={handleSparkleClick}
                style={!isProUser ? { backgroundColor: 'rgba(var(--greys), 0.2)' } : {}}
              >
                <Sparkles />
              </button>
            </div>
          </div>
          
          {/* --- METRICS SCROLL CONTAINER --- */}
          <div className="metrics-scroll-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%'}}>
            <button 
                className="icon" 
                onClick={() => scrollMetrics('left')}
                style={{marginRight: '0.5rem', flexShrink: 0}}
            >
                <ChevronLeft />
            </button>
            
            <div className = "metrics-container" ref={metricsScrollRef} style={{ flex: 1, overflowX: 'auto', scrollBehavior: 'smooth' }}>
                <>
                    {metricsForIndustry.map((metric) => {
                    const isLocked = metric.isPro && !isProUser;
                    const { displayValue, hasData } = getTopLevelData(metric.id);
                    
                    if (isLocked) {
                        return (
                        <div 
                            className="metrics-card pro-metrics"
                            key={metric.id}
                            onClick={handleSparkleClick}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className = "metrics-card-header" style = {{color: 'rgba(var(--blacks) ,0.5)', opacity: 0.6}}>
                            {React.createElement(metric.icon, { 
                                size: 24, 
                                strokeWidth: 1.5,
                                color: 'rgba(var(--blacks), 0.5)' 
                            })} 
                            <p className='medium-bold'>{metric.name}</p>
                            </div>
                            <div className = "metrics-content" style={{opacity: 0.6}}>
                            <p className = "medium-bold" style = {{color: 'rgba(var(--blacks) ,0.3)'}}>Analysis</p>
                            <p>Unlock CarbonX Pro to get your analysis!</p>
                            </div>
                            <div className='logo-animation' style={{marginTop: 'auto'}}>
                            <button 
                                className="icon"
                                onClick={handleSparkleClick}
                                style={{ backgroundColor: 'rgba(var(--greys), 0.2)', color: 'rgba(var(--secondary), 1)' }}
                            >
                                <Lock size={16} />
                            </button>
                            </div>
                        </div>
                        );
                    }
                    
                    return (
                        <div 
                        className={`metrics-card ${activeMetricId === metric.id ? 'active' : ''}`} 
                        key={metric.id}
                        >
                        <div className="metrics-card-header">
                            {React.createElement(metric.icon, { 
                                size: 24, 
                                strokeWidth: 1.5,
                                color: 'rgba(var(--primary), 1)' 
                            })} 
                            <p className='medium-bold' style={{ color: 'rgba(var(--primary) ,1)' }}>{metric.name}</p>
                        </div>
                        <p className="medium-bold">{displayValue.trim()}</p>

                        <div className='logo-animation' style={{marginTop: 'auto'}}>
                            <button 
                            className={`icon ${activeMetricId === metric.id ? 'active' : ''}`}
                            onClick={() => setActiveMetricId(metric.id)}
                            >
                            <ArrowRight />
                            </button>
                        </div>
                        </div>
                    );
                    })}
                </>
            </div>

            <button 
                className="icon" 
                onClick={() => scrollMetrics('right')}
                style={{marginLeft: '0.5rem', flexShrink: 0}}
            >
                <ChevronRight />
            </button>
          </div>

          <div className="sub-header">
            <div className="header-col">
              <p className="descriptor-medium">Metric Breakdown</p>
            </div>
          </div>

          {/* --- METRIC BREAKDOWN SECTION --- */}
          <div>
            {activeBreakdownTemplate ? (
                <div className="metric-breakdown-card">
                  <div className="metrics-card-header large-bold" style={{color: 'rgba(var(--primary), 1)'}}>
                    {React.createElement(activeBreakdownTemplate.icon, { size: 24 })}
                    <p>{activeBreakdownTemplate.title}</p>
                  </div>

                  {/* Pro Insight (real-time, AI-generated) */}
                  {isProUser && (
                    <div className="analysis-content" style={{marginTop: '1rem', backgroundColor: 'rgba(var(--secondary), 0.1)', padding: '1rem', borderRadius: '8px'}}>
                      <div className="pro-analysis-content">
                        <div style={{display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.5rem'}}>
                          <Sparkles size={16} color="rgba(var(--secondary), 1)" />
                          <p className="small-bold" style={{color: 'rgba(var(--secondary), 1)'}}>Pro Insight</p>
                        </div>
                        {proInsightLoading ? (
                          <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)' }}>Updating insight…</p>
                        ) : proInsightError ? (
                          <p className="normal-regular" style={{ color: 'rgba(var(--danger), 1)' }}>{proInsightError}</p>
                        ) : (
                          <p className="normal-regular" style={{ whiteSpace: 'pre-line' }}>{proInsightText || 'Adjust values above to generate an insight.'}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="metric-breakdown-list">
                    
                    {activeBreakdownTemplate.subMetrics.map((sub, idx) => {
                      const isAnalysis = sub.type === 'Discussion and Analysis';
                      const isInfo = sub.type === 'Info';
                      const metricData = metrics.data[sub.dataKey];
                      
                      const isEditable = !isInfo && !isAnalysis;

                      let displayContent = null;

                      if (isInfo) {
                          displayContent = (
                              <p className="normal-regular" style={{fontStyle: 'italic', color: 'rgba(var(--greys), 1)'}}>
                                  {sub.value}
                              </p>
                          );
                      } else if (isAnalysis) {
                        // READ-ONLY FOR ANALYSIS
                        const value = (metricData && metricData.value) || '';
                        displayContent = (
                           <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                              {(!value || value === 'User Input') ? 'Analysis' : value}
                           </p>
                        );
                      } else if (isEditable) {
                        // EDITABLE FIELDS
                        const inputValue = (!metricData || metricData.value === 'User Input' || metricData.value === null) 
                                           ? '' 
                                           : metricData.value;
                        const isCurrency = metricData?.unit === '$';

                        displayContent = (
                           <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>
                             {/* Show unit BEFORE input if currency */}
                             {isCurrency && <span className="normal-regular">{metricData.unit}</span>}
                             
                             <input 
                                type="number" 
                                className="input-base" 
                                placeholder="0.00"
                                value={inputValue}
                                onChange={(e) => handleMetricValueChange(sub.dataKey, e.target.value)}
                                onClick={(e) => e.stopPropagation()} 
                                style={{width: '120px', textAlign: 'right'}}
                             />
                             
                             {/* Show unit AFTER input if NOT currency */}
                             {!isCurrency && <span className="normal-regular">{metricData?.unit || ''}</span>}
                           </div>
                        );
                      } else {
                        // READ-ONLY FIELDS
                        if (metricData) {
                            const val = metricData.value === 'User Input' ? 'N/A' : metricData.value;
                            displayContent = (
                                <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                                    {val !== null ? `${val} ${metricData.unit}` : 'N/A'}
                                </p>
                            );
                        }
                      }
                      
                      const rowStyle = {
                        borderBottom: '1px solid rgba(var(--greys), 0.2)',
                        padding: '1rem',
                        opacity: isAnalysis && !isProUser ? '0.6' : '1', 
                        cursor: isAnalysis && !isProUser ? 'pointer' : 'default',
                      };

                      return (
                        <div 
                          className="sub-metric-row" 
                          style={rowStyle}
                          key={idx}
                          onClick={isAnalysis && !isProUser ? () => setShowProModal(true) : undefined}
                        >
                          <div className="sub-metric-info" style={{width: '100%'}}>
                            <div className="input-group-row" style={{ alignItems: 'center' }}>
                              <p className="medium-bold" style={{flex: 1}}>{sub.name}</p>
                              <div style={{flex: 1, textAlign: 'right'}}>
                                {displayContent}
                              </div>
                            </div>
                            
                            <div className="metric-categories-col" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {sub.sasbCategory && sub.sasbCategory !== 'NA' && (
                                <div>
                                  <p className="descriptor-medium" style={{color: "rgba(var(--greys), 1)"}}>SASB</p>
                                  <p className="nofmal-regular" style={{color: "rgba(var(--blacks), 1)"}}>{sub.sasbCategory}</p>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            ) : (
              <p className="dashboard-empty-text">Select a metric above to see the breakdown.</p>
            )}
          </div>
          
        </div>
      </div>

      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onGoToSettings={() => {
          setShowProModal(false);
          navigate('/settings');
        }}
      />

      <AIChatPopup
        isOpen={showChatPopup}
        onClose={() => setShowChatPopup(false)}
        pageContext="Dashboard"
      />
    </div>
  );
};

export default DashboardPage;