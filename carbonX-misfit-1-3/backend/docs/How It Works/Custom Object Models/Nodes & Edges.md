<span style="font-size:1.5em">The system architecture strictly follows the convention: `Products` act as `Inputs` into `Processes` to `Output` many `Products` </span>

# 1. Nodes
## Product
| Property | Data Type | Examples | Notes |
| --- | --- | --- | --- |
| `id` | `String` | "products/12345" | - |
| `key` | `String` | "12345" | - |
| `name` | `String` | "Model Y" | - |
| `productNature` | `String` | "car" | - |
| `productOrigin` | `String` | "Tesla" | - |
| `quantifiableUnit` | `String` | "unit" | the unit used to measure the quantity of the product |
| `quantityValue` | `Double` | 1.0 | - |
| `emissionInformation` | `Map<String,Map<String,EmissionChart>>` | {"Scope 1" : ExtractionEmissionCharts, "Scope 2" : ProcessingEmissionCharts, "Scope 3" : TransportationEmissionCharts} | {chartType: {variant: EmissionChart}} |
| `functionalProperties` | `Properties` | ? | - |
| `DPP` | `DigitalProductPassport` | ? | - |
| `procedure` | `Collection<Process>` | ? | - |

## Process
| Property | Data Type | Examples | Notes |
| --- | --- | --- | --- |
| `id` | `String` | "processes/12345" | - |
| `key` | `String` | "12345" | - |
| `name` | `String` | "assembly" | - |

# 2. Edges
## Input
| Property | Data Type | Examples | Notes |
| --- | --- | --- | --- |
| `id` | `String` | "products/12345" | - |
| `key` | `String` | "12345" | - |
| `product` | `Product` | ? | ArangoDB sets the `_from` property of this `Input` edge to the `id` of the associated `Product` |
| `productName` | `String` | ? | - |
| `process` | `Process` | ? | ArangoDB sets the `_to` property of this `Input` edge to the `id` of the associated `Process` |
| `processName` | `String` | ? | - |

## Output
| Property | Data Type | Examples | Notes |
| --- | --- | --- | --- |
| `id` | `String` | "products/12345" | - |
| `key` | `String` | "12345" | - |
| `process` | `Process` | ? | ArangoDB sets the `_from` property of this `Output` edge to the `id` of the associated `Process` |
| `processName` | `String` | ? | - |
| `product` | `Product` | ? | ArangoDB sets the `_to` property of this `Output` edge to the `id` of the associated `Product` |
| `productName` | `String` | ? | - |