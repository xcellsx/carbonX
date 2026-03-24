import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DashboardPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import ProModal from '../../components/ProModal/ProModal';
import AIChatPopup from '../../components/AIChatPopup/AIChatPopup';
import {
  Utensils, Leaf, Droplet, ArrowRight, Zap, X,
  Sparkles, CircleCheck, ShieldUser, Wheat, Earth, Plus,
  Database, Car, Recycle, ShieldAlert, HeartPulse, Tags, Users, Globe, Lock,
  Factory, ChevronLeft, ChevronRight, LayoutDashboard, Wind, Scale, AlertTriangle, Plane
} from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { API_BASE, productAPI, maritimeAPI, getLocalLcaMap, getLocalLcaCacheByName, normalizeUserIdKey } from '../../services/api';
import { chatCompletion, POPUP_MODEL } from '../../services/openRouter';
import { useProSubscription } from '../../hooks/useProSubscription';
import { getScopeTotalsFromProduct } from '../../utils/emission';

const allMetricDefinitions = [
  { id: 'scope-1', name: 'Scope 1 Emissions', icon: Factory }, 
  { id: 'scope-2', name: 'Scope 2 Emissions', icon: Zap },
  { id: 'scope-3', name: 'Scope 3 Emissions', icon: Globe },
  { id: 'fleet-fuel-management', name: 'Fleet Fuel Management', icon: Car },
  { id: 'energy-management', name: 'Energy Management', icon: Zap },
  { id: 'food-waste-management', name: 'Food Waste Management', icon: Recycle },
  { id: 'data-security', name: 'Data Security', icon: ShieldAlert },
  { id: 'food-safety', name: 'Food Safety', icon: Utensils },
  { id: 'product-health-nutrition', name: 'Product Health & Nutrition', icon: HeartPulse },
  { id: 'product-labelling-marketing', name: 'Product Labelling & Marketing', icon: Tags },
  { id: 'labour-practices', name: 'Labour Practices', icon: Users },
  { id: 'supply-chain-impacts', name: 'Management of Env. & Social Impacts', icon: Globe },
  { id: 'air-emissions-refrigeration', name: 'Air Emissions from Refrigeration', icon: Wind },
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
  'SCOPE_3': { value: 0, unit: 'kgCO2e', decimals: 2 },

  'TOTAL_GHG': { defaultMax: 100000, decimals: 3, unit: 'kgCO2e' },
  'CALC_TRANSPORT_GHG': { defaultMax: 50000, decimals: 3, unit: 'kgCO2e' },
  'FB-FR-110a.2': { staticValue: 'User Input', unit: 'Gigajoules (GJ)' },
  'FB-FR-110a.3': { staticValue: 'User Input', unit: '%' },
  
  'FB-FR-130a.1': { staticValue: 'User Input', unit: 'Gigajoules (GJ)' },
  'FB-FR-130a.2': { staticValue: 'User Input', unit: '%' },
  'FB-FR-130a.3': { staticValue: 'User Input', unit: '%' },
  'FB-FR-110a.1': { staticValue: 'User Input', unit: '%' },

  // Metrics needing User Input
  'FB-FR-250a.1': { staticValue: 'User Input', unit: 'Metric tonnes (t)' },
  'FB-FR-250a.2': { staticValue: 'User Input', unit: '%' },
  
  // --- SPECIFIC UNITS ---
  'FB-FR-230a.1': { staticValue: 'User Input', unit: '' },         // Number of data breaches
  'FB-FR-230a.2': { staticValue: 'User Input', unit: '%' },         // % personal data breaches
  'FB-FR-230a.4': { staticValue: 'User Input', unit: '' },          // Number of customers affected
  'FB-FR-230a.3': { staticValue: 'User Input', unit: '' },          // Qualitative: approach to data security

  'FB-FR-250b.1': { staticValue: 'User Input', unit: '%' },         // High-risk food safety violation rate
  'FB-FR-250b.2': { staticValue: 'User Input', unit: '' },          // Number of recalls
  'FB-FR-250b.3': { staticValue: 'User Input', unit: '' },          // Number of units recalled
  'FB-FR-250b.4': { staticValue: 'User Input', unit: '%' },         // % units recalled that are private-label

  'FB-FR-260a.2': { staticValue: 'User Input', unit: 'SGD' },       // Revenue from health & nutrition products
  'FB-FR-260a.1': { staticValue: 'User Input', unit: '' },          // Qualitative: process to manage nutritional concerns
  
  'FB-FR-270a.1': { staticValue: 'User Input', unit: '' },          // Number of non-compliance incidents
  'FB-FR-270a.2': { staticValue: 'User Input', unit: 'SGD' },       // Monetary losses from legal proceedings
  'FB-FR-270a.3': { staticValue: 'User Input', unit: 'SGD' },       // Revenue from GMO-labelled products
  'FB-FR-270a.4': { staticValue: 'User Input', unit: 'SGD' },       // Revenue from non-GMO-labelled products

  'FB-FR-330a.1': { staticValue: 'User Input', unit: 'SGD' },       // Hourly wage (average)
  'FB-FR-330a.2': { staticValue: 'User Input', unit: '%' },         // % earning minimum wage
  'FB-FR-330a.3': { staticValue: 'User Input', unit: '%' },         // % under collective agreements
  'FB-FR-330a.4': { staticValue: 'User Input', unit: '' },          // Number of work stoppages
  'FB-FR-330a.5': { staticValue: 'User Input', unit: 'Days' },      // Total days idle
  'FB-FR-330a.6': { staticValue: 'User Input', unit: 'SGD' },       // Monetary losses — labour law violations
  'FB-FR-330a.7': { staticValue: 'User Input', unit: 'SGD' },       // Monetary losses — employment discrimination

  'FB-FR-430a.1': { staticValue: 'User Input', unit: 'SGD' },       // Revenue from certified sustainable sourcing
  'FB-FR-430a.2': { staticValue: 'User Input', unit: '%' },         // % eggs cage-free
  'FB-FR-430a.5': { staticValue: 'User Input', unit: '%' },         // % pork without gestation crates
  'FB-FR-430a.3': { staticValue: 'User Input', unit: '' },          // Qualitative: env & social risk strategy
  'FB-FR-430a.4': { staticValue: 'User Input', unit: '' },          // Qualitative: packaging impact strategy

  'FB-FR-110b.1': { staticValue: 'User Input', unit: 'tCO₂e' },    // Scope 1 emissions from refrigerants
  'FB-FR-110b.2': { staticValue: 'User Input', unit: '%' },         // % refrigerants with zero ozone-depleting potential
  'FB-FR-110b.3': { staticValue: 'User Input', unit: '%' },         // Average refrigerant emissions rate

  'FB-FR-430b.1': { staticValue: 'User Input', unit: 'SGD' },

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
        type: 'ReadOnly', 
        dataKey: 'SCOPE_1', 
        sasbCategory: 'GHG Emissions',
      },
    ]
  },
  'scope-2': {
    title: 'Scope 2 Emissions', icon: Zap,
    subMetrics: [
      { 
        name: 'Indirect Emissions from Purchased Energy', 
        type: 'ReadOnly', 
        dataKey: 'SCOPE_2', 
        sasbCategory: 'GHG Emissions',
      },
    ]
  },
  'scope-3': {
    title: 'Scope 3 Emissions', icon: Globe,
    subMetrics: [
      {
        name: 'All Other Indirect Emissions (Value Chain)',
        type: 'ReadOnly',
        dataKey: 'SCOPE_3',
        sasbCategory: 'GHG Emissions',
      },
      { name: 'Scope 3 Category Mappings', type: 'Info', value: '' },
      { name: 'Fleet Fuel Management', type: 'Info', value: 'Category 4 — Upstream Transportation & Distribution' },
      { name: 'Energy Management', type: 'Info', value: 'Category 3 — Fuel & Energy-Related Activities' },
      { name: 'Food Waste Management', type: 'Info', value: 'Category 5 — Waste Generated in Operations' },
      { name: 'Purchased Goods & Services (Eggs, Pork)', type: 'Info', value: 'Category 1 — Purchased Goods & Services' },
    ]
  },
  'fleet-fuel-management': {
    title: 'Fleet Fuel Management', icon: Car,
    subMetrics: [
      { 
        name: 'Fleet fuel consumed', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-110a.2', 
        sasbCategory: 'Transport & Energy Management',
      },
      { 
        name: 'Percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-110a.3', 
        sasbCategory: 'Transport & Energy Management',
      },
    ]
  },
  'energy-management': {
    title: 'Energy Management', icon: Zap,
    subMetrics: [
      { 
        name: 'Operational energy consumed', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.1',
        sasbCategory: 'Energy Management',
      },
      { 
        name: 'Percentage grid electricity', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.2',
        sasbCategory: 'Energy Management',
      },
      { 
        name: 'Percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.3',
        sasbCategory: 'Energy Management',
      },
    ]
  },
  'food-waste-management': {
    title: 'Food Waste Management', icon: Recycle,
    subMetrics: [
      { 
        name: 'Amount of food waste generated', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250a.1',
        sasbCategory: 'Waste Management',
      },
      {
        name: 'Percentage diverted from waste stream',
        type: 'Quantitative',
        dataKey: 'FB-FR-250a.2',
        sasbCategory: 'Waste Management',
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
        sasbCategory: 'Data Security & Privacy',
      },
      {
        name: 'Percentage that are personal data breaches',
        type: 'Quantitative',
        dataKey: 'FB-FR-230a.2',
        sasbCategory: 'Data Security & Privacy',
      },
      {
        name: 'Number of customers affected',
        type: 'Quantitative',
        dataKey: 'FB-FR-230a.4',
        sasbCategory: 'Data Security & Privacy',
      },
      {
        name: 'Description of approach to identifying & addressing data security risks',
        type: 'Discussion and Analysis',
        dataKey: 'FB-FR-230a.3',
        sasbCategory: 'Data Security & Privacy',
      },
    ]
  },
  'food-safety': {
    title: 'Food Safety', icon: Utensils,
    subMetrics: [
      {
        name: 'High-risk food safety violation rate',
        type: 'Quantitative',
        dataKey: 'FB-FR-250b.1',
        sasbCategory: 'Food Safety & Compliance',
      },
      {
        name: 'Number of recalls',
        type: 'Quantitative',
        dataKey: 'FB-FR-250b.2',
        sasbCategory: 'Product Quantity & Traceability',
      },
      {
        name: 'Number of units recalled',
        type: 'Quantitative',
        dataKey: 'FB-FR-250b.3',
        sasbCategory: 'Product Quantity & Traceability',
      },
      {
        name: 'Percentage of units recalled that are private-label products',
        type: 'Quantitative',
        dataKey: 'FB-FR-250b.4',
        sasbCategory: 'Product Quantity & Traceability',
      },
    ]
  },
  'product-health-nutrition': {
    title: 'Product Health & Nutrition', icon: HeartPulse,
    subMetrics: [
      {
        name: 'Revenue from products labelled or marketed to promote health and nutrition attributes',
        type: 'Quantitative',
        dataKey: 'FB-FR-260a.2',
        sasbCategory: 'Product Health & Nutrition',
      },
      {
        name: 'Discussion of process to identify and manage products and ingredients related to nutritional and health concerns',
        type: 'Discussion and Analysis',
        dataKey: 'FB-FR-260a.1',
        sasbCategory: 'Product Health & Nutrition',
      },
    ]
  },
  'product-labelling-marketing': {
    title: 'Product Labelling & Marketing', icon: Tags,
    subMetrics: [
      {
        name: 'Number of incidents of non-compliance with industry or regulatory labelling or marketing codes',
        type: 'Quantitative',
        dataKey: 'FB-FR-270a.1',
        sasbCategory: 'Responsible Marketing & Labelling',
      },
      {
        name: 'Total monetary losses from legal proceedings associated with marketing or labelling practices',
        type: 'Quantitative',
        dataKey: 'FB-FR-270a.2',
        sasbCategory: 'Responsible Marketing & Labelling',
      },
      {
        name: 'Revenue from products labelled as containing GMOs',
        type: 'Quantitative',
        dataKey: 'FB-FR-270a.3',
        sasbCategory: 'Responsible Marketing & Labelling',
      },
      {
        name: 'Revenue from products labelled as non-GMO',
        type: 'Quantitative',
        dataKey: 'FB-FR-270a.4',
        sasbCategory: 'Responsible Marketing & Labelling',
      },
    ]
  },
  'labour-practices': {
    title: 'Labour Practices', icon: Users,
    subMetrics: [
      {
        name: 'Average hourly wage',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.1',
        sasbCategory: 'Wages & Benefits',
      },
      {
        name: 'Percentage of in-store and distribution centre employees earning minimum wage, by region',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.2',
        sasbCategory: 'Wages & Benefits',
      },
      {
        name: 'Percentage of active workforce employed under collective agreements',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.3',
        sasbCategory: 'Labour Relations',
      },
      {
        name: 'Number of work stoppages',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.4',
        sasbCategory: 'Labour Relations',
      },
      {
        name: 'Total days idle',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.5',
        sasbCategory: 'Labour Relations',
      },
      {
        name: 'Monetary losses from legal proceedings — labour law violations',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.6',
        sasbCategory: 'Labour Practices & Legal Compliance',
      },
      {
        name: 'Monetary losses from legal proceedings — employment discrimination',
        type: 'Quantitative',
        dataKey: 'FB-FR-330a.7',
        sasbCategory: 'Labour Practices & Legal Compliance',
      },
    ]
  },
  'supply-chain-impacts': {
    title: 'Management of Env. & Social Impacts', icon: Globe,
    subMetrics: [
      {
        name: 'Revenue from products third-party certified to environmental or social sustainability sourcing standards',
        type: 'Quantitative',
        dataKey: 'FB-FR-430a.1',
        sasbCategory: 'Supply-Chain Management / Sourcing',
      },
      {
        name: 'Percentage of revenue from eggs that originated from a cage-free environment',
        type: 'Quantitative',
        dataKey: 'FB-FR-430a.2',
        sasbCategory: 'Animal Welfare / Supply Chain',
      },
      {
        name: 'Percentage of revenue from pork produced without the use of gestation crates',
        type: 'Quantitative',
        dataKey: 'FB-FR-430a.5',
        sasbCategory: 'Animal Welfare / Supply Chain',
      },
      {
        name: 'Discussion of strategy to manage environmental and social risks within the supply chain, including animal welfare',
        type: 'Discussion and Analysis',
        dataKey: 'FB-FR-430a.3',
        sasbCategory: 'Supply-Chain Management / Sourcing',
      },
      {
        name: 'Discussion of strategies to reduce the environmental impact of packaging',
        type: 'Discussion and Analysis',
        dataKey: 'FB-FR-430a.4',
        sasbCategory: 'Supply-Chain Management / Sourcing',
      },
    ]
  },

  'air-emissions-refrigeration': {
    title: 'Air Emissions from Refrigeration', icon: Wind,
    subMetrics: [
      {
        name: 'Gross global Scope 1 emissions from refrigerants',
        type: 'Quantitative',
        dataKey: 'FB-FR-110b.1',
        sasbCategory: 'Refrigerant Management / Fugitive Emissions',
      },
      {
        name: 'Percentage of refrigerants consumed with zero ozone-depleting potential',
        type: 'Quantitative',
        dataKey: 'FB-FR-110b.2',
        sasbCategory: 'Refrigerant Management / Fugitive Emissions',
      },
      {
        name: 'Average refrigerant emissions rate',
        type: 'Quantitative',
        dataKey: 'FB-FR-110b.3',
        sasbCategory: 'Refrigerant Management / Fugitive Emissions',
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

const STORAGE_KEY_TEMPLATES = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getEffectiveKey(p) {
  const directKey = (p?.key && String(p.key).trim()) || (p?._key && String(p._key).trim());
  if (directKey) return directKey;
  const rawId = p?.id ?? p?._id;
  if (rawId && String(rawId).includes('/')) return String(rawId).split('/').pop();
  return rawId ? String(rawId) : '';
}

/** Match Inventory / Voyage Emissions (localStorage company sector · industry). */
function isMarineTransportProfile(sector, industry) {
  const s = String(sector || '').toLowerCase().trim();
  const i = String(industry || '').toLowerCase().trim();
  return (
    s.includes('maritime') ||
    i.includes('maritime') ||
    s.includes('marine transport') ||
    i.includes('marine transportation') ||
    i.includes('marine transport')
  );
}

function scope1KgFromMaritimeLcaResponse(lcaRes) {
  const raw = lcaRes?.data?.scope1;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === 'object' && raw.kgCO2e != null) {
    const n = Number(raw.kgCO2e);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

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
        const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
        const storageKey = currentUserId.includes('/') ? currentUserId.split('/').pop() : currentUserId;
        const userCompany = allCompanyData[currentUserId] ?? allCompanyData[storageKey] ?? null;
        const sector = (userCompany?.sector || '').trim();
        const industry = (userCompany?.industry || '').trim();
        const isMarineTransport = isMarineTransportProfile(sector, industry);

        // Product list: must match Inventory fetch scope to keep totals consistent.
        let productsList = [];
        try {
          const normalizedCurrentUserId = normalizeUserIdKey(currentUserId);
          const res = await productAPI.getAllProducts(
            normalizedCurrentUserId ? { userId: normalizedCurrentUserId } : {}
          );
          const rawProducts = Array.isArray(res?.data) ? res.data : [];
          // Same safety filter as Inventory
          productsList = normalizedCurrentUserId
            ? rawProducts.filter((p) => !p.userId || normalizeUserIdKey(p.userId) === normalizedCurrentUserId)
            : rawProducts;
        } catch (_) {
          productsList = [];
        }

        const productCount = productsList.length;

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

        // --- Computed values from Inventory LCA (backend products + localStorage calculated values) ---
        // Prefer: 1) name cache (has full scope breakdown from calculation),
        // 2) localStorage by productKey, 3) raw DPP/emissionInformation as final fallback.
        const localLcaMap = getLocalLcaMap(currentUserId);
        const localLcaByName = getLocalLcaCacheByName();
        const storedTemplates = getStoredTemplates();
        // Include user's backend products and any template products that have a cached LCA
        // Match Inventory behavior: include products without userId as shared/default data,
        // plus products owned by the current user.
        const normalizedCurrentUserId = normalizeUserIdKey(currentUserId);
        const userFilteredProducts = productsList.filter(
          (p) => !p.userId || normalizeUserIdKey(p.userId) === normalizedCurrentUserId
        );
        const backendNameSet = new Set(
          userFilteredProducts.map((p) => String(p?.name || '').toLowerCase().trim()).filter(Boolean)
        );
        // Mirror Inventory: templates are active only when no backend product has the same name.
        const activeTemplates = storedTemplates.filter(
          (t) => !backendNameSet.has(String(t?.name || '').toLowerCase().trim())
        );
        const activeTemplateKeySet = new Set(
          activeTemplates
            .map((t) => (t?.id != null ? `template-${String(t.id)}` : ''))
            .filter(Boolean)
        );
        const hasTemplateEntries = activeTemplates.length > 0;
        const hasTemplateLcaEntries = Object.keys(localLcaMap).some((k) => activeTemplateKeySet.has(String(k)));

        let maritimeVesselCount = 0;
        let maritimeVoyageKg = 0;
        if (isMarineTransport) {
          try {
            const logsRes = await maritimeAPI.getShipLogs();
            const rawLogs = Array.isArray(logsRes?.data) ? logsRes.data : [];
            const mmsiSet = new Set();
            rawLogs.forEach((log) => {
              const m = String(log?.mmsi || log?.MMSI || '').trim();
              if (m) mmsiSet.add(m);
            });
            maritimeVesselCount = mmsiSet.size;
            const lcaRows = await Promise.all(
              [...mmsiSet].map(async (mmsi) => {
                try {
                  const lcaRes = await maritimeAPI.getLca(mmsi);
                  return scope1KgFromMaritimeLcaResponse(lcaRes);
                } catch {
                  return 0;
                }
              })
            );
            maritimeVoyageKg = lcaRows.reduce((a, b) => a + b, 0);
          } catch (e) {
            console.warn('[Dashboard] Maritime voyage aggregate failed:', e?.message || e);
          }
        }

        const hasAnyProducts =
          productCount > 0 || hasTemplateEntries || hasTemplateLcaEntries || maritimeVesselCount > 0;
        setHasProducts(hasAnyProducts);
        // Dashboard must reflect calculated values (same source as Inventory), not raw emission defaults.
        const totals = { scope1: 0, scope2: 0, scope3: 0 };
        let hasAnyCacheContribution = false;
        const addedNames = new Set();
        const addByNameCache = (name) => {
          const nameKey = String(name || '').toLowerCase().trim();
          if (!nameKey || addedNames.has(nameKey)) return false;
          const cached = localLcaByName[nameKey];
          if (!cached || typeof cached !== 'object' || typeof cached.total !== 'number') return false;
          totals.scope1 += Number(cached.scope1) || 0;
          totals.scope2 += Number(cached.scope2) || 0;
          totals.scope3 += Number(cached.scope3) || 0;
          addedNames.add(nameKey);
          hasAnyCacheContribution = true;
          return true;
        };

        // 1) Prefer scope breakdowns cached by product name (one per product name).
        userFilteredProducts.forEach((p) => {
          addByNameCache(p.name);
        });
        const templateIdToName = new Map();
        activeTemplates.forEach((t) => {
          const tid = t?.id != null ? String(t.id) : '';
          if (tid) templateIdToName.set(`template-${tid}`, String(t?.name || '').toLowerCase().trim());
          addByNameCache(t?.name);
        });

        // 2) Fallback: if a user product has key-based LCA only, treat it as scope3 total.
        userFilteredProducts.forEach((p) => {
          const nameKey = String(p.name || '').toLowerCase().trim();
          if (nameKey && addedNames.has(nameKey)) return;
          const effectiveKey = getEffectiveKey(p);
          const localLcaTotal = localLcaMap[effectiveKey] != null ? Number(localLcaMap[effectiveKey]) : null;
          if (localLcaTotal != null && !Number.isNaN(localLcaTotal)) {
            totals.scope3 += localLcaTotal;
            hasAnyCacheContribution = true;
          }
        });

        // 3) Template key-only fallback.
        Object.entries(localLcaMap).forEach(([key, val]) => {
          if (!String(key).startsWith('template-')) return;
          if (!activeTemplateKeySet.has(String(key))) return;
          const templateNameKey = templateIdToName.get(String(key));
          if (templateNameKey && addedNames.has(templateNameKey)) return;
          const lcaTotal = Number(val);
          if (Number.isNaN(lcaTotal)) return;
          totals.scope3 += lcaTotal;
          hasAnyCacheContribution = true;
        });

        // If no calculated cache exists yet, fallback to backend product scope values
        // (same filtered product set) so Dashboard does not show all zeros.
        if (!hasAnyCacheContribution && userFilteredProducts.length > 0) {
          userFilteredProducts.forEach((p) => {
            const t = getScopeTotalsFromProduct({
              DPP: p?.DPP ?? p?.dpp,
              emissionInformation: p?.emissionInformation ?? p?.emission_information,
            });
            totals.scope1 += t.scope1 || 0;
            totals.scope2 += t.scope2 || 0;
            totals.scope3 += t.scope3 || 0;
          });
        }
        totals.scope1 += maritimeVoyageKg;
        totals.total = totals.scope1 + totals.scope2 + totals.scope3;

        // Always prefer computed totals when products exist (reflects latest calculations).
        // Round to 2dp at the source so all display paths (cards, inputs, breakdowns) show clean values.
        const round2 = (n) => Math.round(n * 100) / 100;
        if (hasAnyProducts) {
          if (baseData['SCOPE_1']) baseData['SCOPE_1'].value = round2(totals.scope1);
          if (baseData['SCOPE_2']) baseData['SCOPE_2'].value = round2(totals.scope2);
          if (baseData['SCOPE_3']) baseData['SCOPE_3'].value = round2(totals.scope3);
          if (baseData['TOTAL_GHG']) baseData['TOTAL_GHG'].value = round2(totals.total);
          if (baseData['CALC_TRANSPORT_GHG']) baseData['CALC_TRANSPORT_GHG'].value = round2(totals.total);

          // Approximate fleet fuel consumed (GJ) from total LCA kgCO₂e using diesel emission factor.
          // Diesel: ~2.68 kgCO₂e/litre, energy content ~0.0386 GJ/litre → GJ = (kgCO₂e / 2.68) * 0.0386
          // Only set if the user hasn't manually entered a value already.
          const skipFnBFuelHeuristic = isMarineTransport && maritimeVesselCount > 0;
          const fuelEntry = baseData['FB-FR-110a.2'];
          const fuelAlreadySet = fuelEntry && fuelEntry.value !== null && fuelEntry.value !== 'User Input' && parseFloat(fuelEntry.value) > 0;
          if (!skipFnBFuelHeuristic && !fuelAlreadySet && totals.total > 0) {
            const approxLitres = totals.total / 2.68;
            const approxGj = round2(approxLitres * 0.0386);
            if (baseData['FB-FR-110a.2']) baseData['FB-FR-110a.2'].value = approxGj;
          }

          // Approximate operational energy consumed (GJ) from LCA scope totals.
          // Scope 1 (combustion): use diesel factor 2.68 kgCO₂e/L, 0.0386 GJ/L.
          // Scope 2 (grid electricity): use avg grid factor 0.233 kgCO₂e/kWh → GJ = scope2 / 0.233 * 0.0036
          const energyEntry = baseData['FB-FR-130a.1'];
          const energyAlreadySet = energyEntry && energyEntry.value !== null && energyEntry.value !== 'User Input' && parseFloat(energyEntry.value) > 0;
          if (!skipFnBFuelHeuristic && !energyAlreadySet && (totals.scope1 > 0 || totals.scope2 > 0)) {
            const gjFromScope1 = (totals.scope1 / 2.68) * 0.0386;
            const gjFromScope2 = (totals.scope2 / 0.233) * 0.0036;
            const totalEnergyGj = round2(gjFromScope1 + gjFromScope2);
            if (baseData['FB-FR-130a.1']) baseData['FB-FR-130a.1'].value = totalEnergyGj;

            // Percentage grid electricity = scope2-derived GJ / total energy GJ
            const gridPctEntry = baseData['FB-FR-130a.2'];
            const gridPctAlreadySet = gridPctEntry && gridPctEntry.value !== null && gridPctEntry.value !== 'User Input' && parseFloat(gridPctEntry.value) > 0;
            if (!gridPctAlreadySet && totalEnergyGj > 0) {
              const gridPct = round2((gjFromScope2 / totalEnergyGj) * 100);
              if (baseData['FB-FR-130a.2']) baseData['FB-FR-130a.2'].value = gridPct;
            }
          }

          const isAirlines = sector === 'Transportation' && industry === 'Airlines';
          if (isMarineTransport && baseData['TR-MR-GHG-1']) {
            baseData['TR-MR-GHG-1'].value = round2(totals.scope1);
          }
          if (isAirlines && baseData['TR-AR-GHG-1']) baseData['TR-AR-GHG-1'].value = round2(totals.total);
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
          "scope-3",
          "fleet-fuel-management",
          "energy-management",
          "food-waste-management",
          "data-security",
          "food-safety",
          "product-health-nutrition",
          "product-labelling-marketing",
          "labour-practices",
          "supply-chain-impacts",
          "air-emissions-refrigeration",
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

        const isFnb = sector === 'Food & Beverages' || sector === 'FNB' || sector === 'F&B';
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
          maritimeVesselCount,
          maritimeVoyageKg: Math.round(maritimeVoyageKg * 100) / 100,
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

  // --- Build context summary for AI chat (covers all metrics with real values + benchmarks) ---
  const dashboardContextSummary = useMemo(() => {
    const lines = [];

    // GHG Benchmarks (always included so AI can answer target questions even with no data)
    lines.push('--- GHG BENCHMARKS & TARGETS ---');
    lines.push('Science-Based Targets (SBTi) Net Zero: 90%+ absolute reduction in Scope 1+2+3 by 2050 vs baseline; 4.2% reduction per year from 2020.');
    lines.push('Paris Agreement 1.5°C pathway: ~50% absolute GHG reduction by 2030 vs 2019 baseline.');
    lines.push('Singapore Green Plan 2030 (climate): Peak emissions before 2030, net-zero by 2050. National target: 60 MtCO2e by 2030.');
    lines.push('Singapore Carbon Tax: SGD 5/tCO2e (2019–2023) → SGD 25/tCO2e (2024–2025) → SGD 45/tCO2e (2026–2027) → SGD 50–80/tCO2e by 2030.');
    lines.push('CDP A-List threshold: Scope 1+2 intensity reduction >10% YoY; Scope 3 disclosure required.');
    lines.push('Food & Beverage sector average (MSCI): Scope 1+2 intensity ~50–120 tCO2e per SGD 1M revenue; leading companies <30.');
    lines.push('');

    if (!metrics?.data) {
      lines.push('--- COMPANY DATA ---');
      lines.push('No metric values have been entered yet.');
      return lines.join('\n');
    }

    const data = metrics.data;

    // GHG actuals
    lines.push('--- COMPANY GHG DATA ---');
    const s1 = data['SCOPE_1']?.value;
    const s2 = data['SCOPE_2']?.value;
    const s3 = data['SCOPE_3']?.value;
    const total = data['TOTAL_GHG']?.value;
    if (s1 != null) lines.push(`Scope 1 Emissions: ${s1} kgCO2e`);
    if (s2 != null) lines.push(`Scope 2 Emissions: ${s2} kgCO2e`);
    if (s3 != null) lines.push(`Scope 3 Emissions: ${s3} kgCO2e`);
    if (total != null) lines.push(`Total GHG Emissions: ${total} kgCO2e`);
    if (s1 != null && s2 != null && s3 != null) {
      const totalVal = Number(s1) + Number(s2) + Number(s3);
      const scope3Pct = totalVal > 0 ? ((Number(s3) / totalVal) * 100).toFixed(1) : null;
      if (scope3Pct) lines.push(`Scope 3 as % of total: ${scope3Pct}% (industry avg ~70–80% for F&B)`);
    }
    lines.push('');

    // All other entered metric values
    lines.push('--- OTHER ENTERED METRICS ---');
    const metricIds = metrics.metricList || [];
    let hasOtherMetrics = false;
    metricIds.forEach((metricId) => {
      const breakdown = METRIC_BREAKDOWN_DATA[metricId];
      if (!breakdown) return;
      const subMetrics = (breakdown.subMetrics || []).filter(
        (sm) => sm.dataKey && sm.type !== 'Info' && sm.type !== 'ReadOnly' && sm.type !== 'Discussion and Analysis'
      );
      if (subMetrics.length === 0) return;
      const metricLines = [];
      subMetrics.forEach((sm) => {
        const entry = data[sm.dataKey];
        const val = entry?.value;
        if (val == null || val === '' || val === 0) return;
        const unit = entry?.unit || ALL_METRIC_DATA_DEFINITIONS[sm.dataKey]?.unit || '';
        metricLines.push(`  - ${sm.name}: ${val}${unit ? ' ' + unit : ''}`);
      });
      if (metricLines.length > 0) {
        lines.push(`${breakdown.title}:`);
        metricLines.forEach((l) => lines.push(l));
        hasOtherMetrics = true;
      }
    });
    if (!hasOtherMetrics) lines.push('No additional metrics entered yet.');

    return lines.join('\n');
  }, [metrics]);

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

    // Clear stale insight text when switching to a different metric so the UI doesn't show old content
    const prevKey = proInsightReqKeyRef.current;
    const prevMetricId = prevKey ? JSON.parse(prevKey).metricId : null;
    if (activeMetricId !== prevMetricId) {
      setProInsightText('');
      setProInsightLoading(false);
      setProInsightError('');
    }

    if (reqKey === proInsightReqKeyRef.current) return;
    proInsightReqKeyRef.current = reqKey;

    if (proInsightDebounceRef.current) clearTimeout(proInsightDebounceRef.current);

    proInsightDebounceRef.current = setTimeout(async () => {
      const CACHE_KEY = 'carbonx_pro_insights_cache_v6';
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

      const hasAnyValues = snapshot.some(
        (x) => x.value !== null && x.value !== 'User Input' && x.value !== '' && x.type !== 'Discussion and Analysis'
      );

      const SYSTEM = `You are Sprout AI for CarbonX, a sustainability analyst for food & beverage companies.
You will be given metric values for a specific ESG/sustainability metric.
${hasAnyValues
  ? `Your job is to:
1. State the industry benchmark or acceptable range for this metric with specific numbers (e.g. "Industry average is X; leading practice is Y").
2. Quantify how the current value compares to that benchmark using plain language (e.g. "Your value is 2.3 times above the sector median of Z", or "Your value is 10 percentage points below the target of 20%").
3. If values are within the acceptable range: respond with one short encouraging sentence starting with "You're on track —" followed by the benchmark comparison.
4. If values need improvement: give 2–4 short actionable bullet points. Each bullet must name the specific gap with a number and suggest one concrete action.`
  : `No values have been entered yet. Give 2–4 short generalised bullet points explaining what this metric measures, what good performance looks like (with industry benchmarks where possible), and what actions a food & beverage company should take to perform well on it.`}
Do not use abbreviations like "pp" — write "percentage points" in full.
Do not use vague language like "consider" or "may". Be direct and specific.
Do not mention that you are an AI. Do not ask questions. Do not include citations or source links.`;

      const USER = `Metric: ${activeBreakdownTemplate.title}\nSASB Category: ${snapshot[0]?.sasbCategory ?? 'N/A'}\n\nCurrent values:\n${snapshot
        .filter((x) => x.type !== 'Discussion and Analysis')
        .map((x) => {
          const v = (x.value === null || x.value === 'User Input' || x.value === '') ? 'not yet provided' : `${x.value}${x.unit ? ` ${x.unit}` : ''}`;
          return `- ${x.name}: ${v}`;
        })
        .join('\n')}\n\nProvide the insight now.`;

      try {
        const reply = await chatCompletion(
          [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: USER },
          ],
          { model: POPUP_MODEL, max_tokens: 800, temperature: 0.3 }
        );
        // Strip citation markers like [1], [2][3], etc. added by web-backed models
        const cleaned = (reply || '').trim().replace(/\[\d+\]/g, '');
        console.debug('[ProInsight] raw reply:', cleaned);
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

  /** Format a metric value to 2 decimal places if it is a finite number, otherwise return as-is. */
  const fmtMetric = (val) => {
    if (val === null || val === undefined || val === '' || val === 'User Input') return val;
    const n = Number(val);
    if (!Number.isFinite(n)) return val;
    return n.toFixed(2);
  };

  const getTopLevelData = (metricId) => {
    const breakdown = METRIC_BREAKDOWN_DATA[metricId];
    if (!breakdown || !metrics) return { displayValue: 'N/A', hasData: false };

    if (metricId === 'scope-1' || metricId === 'scope-2' || metricId === 'scope-3') {
        const key = metricId === 'scope-1' ? 'SCOPE_1' : metricId === 'scope-2' ? 'SCOPE_2' : 'SCOPE_3';
        const d = metrics.data[key];
        if(d) return { displayValue: `${fmtMetric(d.value)} ${d.unit}`, hasData: true };
    }

    // UPDATED: For Food Safety, use the Recalls metric (which has the unit)
    if (metricId === 'food-safety') {
      const metricData = metrics.data['FB-FR-250b.2']; // Recalls metric
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          return { displayValue: `${fmtMetric(val)} ${metricData.unit}`, hasData: true };
      }
    }

    if (metricId === 'fleet-fuel-management') {
      const fuelData = metrics.data['FB-FR-110a.2'];
      if (fuelData && fuelData.value !== null && fuelData.value !== 'User Input' && parseFloat(fuelData.value) > 0) {
        return { displayValue: `${fmtMetric(fuelData.value)} ${fuelData.unit}`, hasData: true };
      }
      return { displayValue: 'User Input', hasData: true };
    }

    if (metricId === 'energy-management') {
      const metricData = metrics.data['FB-FR-130a.1'];
      if (metricData && metricData.value !== null && metricData.value !== 'User Input' && parseFloat(metricData.value) > 0) {
        return { displayValue: `${fmtMetric(metricData.value)} ${metricData.unit}`, hasData: true };
      }
      return { displayValue: 'User Input', hasData: true };
    }

    const firstQuantMetric = breakdown.subMetrics.find(sub => sub.type === 'Quantitative');
    if (firstQuantMetric) {
      const metricData = metrics.data[firstQuantMetric.dataKey];
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          if (metricData.unit === '$' || metricData.unit === 'SGD') {
            return { displayValue: `${metricData.unit} ${fmtMetric(val)}`, hasData: true };
          }
          return { displayValue: `${fmtMetric(val)} ${metricData.unit}`.trim(), hasData: true };
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
                  {metrics?.maritimeVesselCount > 0 && (
                    <>
                      Aggregated voyage LCA from {metrics.maritimeVesselCount} vessel
                      {metrics.maritimeVesselCount === 1 ? '' : 's'} in ship logs
                      {typeof metrics.maritimeVoyageKg === 'number'
                        ? ` (~${Number(metrics.maritimeVoyageKg).toFixed(2)} kgCO₂e scope 1). `
                        : '. '}
                    </>
                  )}
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

                  {/* Pro Insight box — only shown when there's no Discussion & Analysis sub-metric
                      (those metrics render the insight inline within their own row) */}
                  {isProUser && !activeBreakdownTemplate.subMetrics.some(s => s.type === 'Discussion and Analysis') && (
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
                        ) : proInsightText ? (
                          <div className="normal-regular" style={{ whiteSpace: 'pre-line' }}>
                            {proInsightText.split('\n').map((line, i) => {
                              const parts = line.split(/\*\*(.+?)\*\*/g);
                              return (
                                <p key={i} style={{ margin: i === 0 ? 0 : '0.3rem 0 0' }}>
                                  {parts.map((part, j) =>
                                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                  )}
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="normal-regular" style={{ color: 'rgba(var(--greys), 0.7)' }}>Adjust values above to generate an insight.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="metric-breakdown-list">
                    
                    {activeBreakdownTemplate.subMetrics.map((sub, idx) => {
                      const isAnalysis = sub.type === 'Discussion and Analysis';
                      const isInfo = sub.type === 'Info';
                      const isReadOnly = sub.type === 'ReadOnly';
                      const metricData = metrics.data[sub.dataKey];
                      
                      const isEditable = !isInfo && !isAnalysis && !isReadOnly;
                      const inputValue = isEditable
                        ? ((!metricData || metricData.value === 'User Input' || metricData.value === null) ? '' : metricData.value)
                        : null;

                      // Discussion & Analysis rows render as their own section, not a standard row
                      if (isAnalysis) {
                        return (
                          <div key={idx} style={{ padding: '1rem', borderBottom: '1px solid rgba(var(--greys), 0.2)' }}>
                            <p className="medium-bold" style={{ marginBottom: '0.5rem' }}>{sub.name}</p>
                            {isProUser ? (
                              <div style={{ backgroundColor: 'rgba(var(--secondary), 0.07)', borderRadius: '8px', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <Sparkles size={13} color="rgba(var(--secondary), 1)" />
                                  <span className="small-bold" style={{ color: 'rgba(var(--secondary), 1)' }}>AI Generated</span>
                                </div>
                                {proInsightLoading ? (
                                  <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)' }}>Generating…</p>
                                ) : proInsightText ? (
                                  <div className="normal-regular" style={{ whiteSpace: 'pre-line' }}>
                                    {proInsightText.split('\n').map((line, li) => {
                                      const parts = line.split(/\*\*(.+?)\*\*/g);
                                      return (
                                        <p key={li} style={{ margin: li === 0 ? 0 : '0.3rem 0 0' }}>
                                          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                                        </p>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="normal-regular" style={{ color: 'rgba(var(--greys), 0.7)' }}>Generating insight…</p>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{ backgroundColor: 'rgba(var(--greys), 0.08)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', opacity: 0.6 }}
                                onClick={() => setShowProModal(true)}
                              >
                                <p className="normal-regular" style={{ fontStyle: 'italic', color: 'rgba(var(--greys), 1)' }}>Upgrade to Pro to unlock AI-generated analysis.</p>
                              </div>
                            )}
                            {sub.sasbCategory && sub.sasbCategory !== 'NA' && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <p className="descriptor-medium" style={{ color: 'rgba(var(--greys), 1)' }}>SASB</p>
                                <p className="normal-regular" style={{ color: 'rgba(var(--blacks), 1)' }}>{sub.sasbCategory}</p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      let displayContent = null;

                      if (isInfo) {
                        if (!sub.value) {
                          // Section heading row
                          displayContent = null;
                        } else {
                          displayContent = (
                            <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)' }}>
                              {sub.value}
                            </p>
                          );
                        }
                      } else if (isReadOnly) {
                        const val = metricData?.value;
                        const display = (val === null || val === undefined || val === 'User Input') ? '—' : `${fmtMetric(val)} ${metricData?.unit ?? ''}`.trim();
                        displayContent = (
                          <p className="medium-bold" style={{ color: 'rgba(var(--primary), 1)', textAlign: 'right' }}>
                            {display}
                          </p>
                        );
                      } else if (isEditable) {
                        // EDITABLE FIELDS
                        const isCurrency = metricData?.unit === '$' || metricData?.unit === 'SGD';
                        const isEmpty = inputValue === '' || inputValue === null;
                        displayContent = (
                           <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                             {isCurrency && <span className="normal-regular">{metricData.unit}</span>}
                             <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>
                               {isEmpty && (
                                 <span style={{
                                   fontSize: '0.72rem',
                                   color: 'rgba(var(--secondary), 1)',
                                   fontStyle: 'italic',
                                 }}>✎ Enter a value</span>
                               )}
                               <input
                                  type="number"
                                  className="input-base"
                                  placeholder="0.00"
                                  value={inputValue}
                                  onChange={(e) => handleMetricValueChange(sub.dataKey, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '120px',
                                    textAlign: 'right',
                                    borderColor: isEmpty ? 'rgba(var(--secondary), 0.5)' : undefined,
                                  }}
                               />
                             </div>
                             {!isCurrency && <span className="normal-regular">{metricData?.unit || ''}</span>}
                           </div>
                        );
                      } else {
                        // READ-ONLY FIELDS
                        if (metricData) {
                            const val = metricData.value === 'User Input' ? 'N/A' : fmtMetric(metricData.value);
                            displayContent = (
                                <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                                    {val !== null ? `${val} ${metricData.unit}` : 'N/A'}
                                </p>
                            );
                        }
                      }
                      
                      // Info heading rows (empty value) render as a section divider
                      if (isInfo && !sub.value) {
                        return (
                          <div key={idx} style={{ padding: '0.75rem 1rem 0.25rem', borderBottom: '1px solid rgba(var(--greys), 0.2)' }}>
                            <p className="descriptor-medium" style={{ color: 'rgba(var(--greys), 1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sub.name}</p>
                          </div>
                        );
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
                              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                {displayContent}
                              </div>
                            </div>
                            
                            {sub.sasbCategory && sub.sasbCategory !== 'NA' && (
                              <div className="metric-categories-col" style={{ marginTop: '0.75rem' }}>
                                <p className="descriptor-medium" style={{ color: 'rgba(var(--greys), 1)' }}>SASB</p>
                                <p className="normal-regular" style={{ color: 'rgba(var(--blacks), 1)' }}>{sub.sasbCategory}</p>
                              </div>
                            )}

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
        contextSummary={dashboardContextSummary}
      />
    </div>
  );
};

export default DashboardPage;