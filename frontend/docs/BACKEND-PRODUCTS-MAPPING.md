# Backend GET /api/products – Mapping by template category

The backend returns an **array of product documents** (e.g. 16 items). This doc maps them by **template category** (Pasta, Bowls, Soup) to match **Add Products** / **Browse Templates** in the app.

Template categories are defined in `AddProductsPage.jsx` as `FOOD_GROUPS`: **Pasta**, **Bowls**, **Soup**. **Raw materials** are shown in **Browse Templates** (Add Products) as a separate accordion group: the exact 16 items from `GET /api/products`, each displayed as a **template card with weight only** (no Elements/Processes). They are not merged with other template groups (e.g. Aglio Olio, Carbonara stay in their own groups).

---

## 1. Mapping by template category

### Raw materials (Browse Templates, from backend)

The **Raw materials** accordion on the Browse Templates page lists **only** the 16 items returned by `GET /api/products`. Each item is shown as a template card with **Weight** (quantityValue + quantifiableUnit) only—no Elements or Processes. "Add" adds that raw material to Customize your own. Data is fetched when the page loads.

Example 16 from the console (your backend may vary):

| # | Backend `name` | Backend `type` | Weight column |
|---|----------------|----------------|---------------|
| 0 | spaghetti | dish | quantityValue + quantifiableUnit (e.g. kg) |
| 1 | raw pasta | ingredient | quantityValue + quantifiableUnit |
| 2 | tomato sauce | ingredient | quantityValue + quantifiableUnit |
| 3 | waste water | waste | quantityValue + quantifiableUnit |
| 4 | pasta | ingredient | quantityValue + quantifiableUnit |
| 5 | hot dogs | ingredient | quantityValue + quantifiableUnit |
| 6 | salt | ingredient | quantityValue + quantifiableUnit |
| 7 | pepper | ingredient | quantityValue + quantifiableUnit |
| 8 | sugar | ingredient | quantityValue + quantifiableUnit |
| 9 | garlic | ingredient | quantityValue + quantifiableUnit |
| 10 | onions | ingredient | quantityValue + quantifiableUnit |
| 11 | clean water | ingredient | quantityValue + quantifiableUnit |
| 12 | waste water | waste | quantityValue + quantifiableUnit |
| 13 | cheese | ingredient | quantityValue + quantifiableUnit |
| 14 | tomato paste | ingredient | quantityValue + quantifiableUnit |
| 15 | olive oil | ingredient | quantityValue + quantifiableUnit |

---

### Pasta (template category `pasta`)

| Backend `name` | Backend `type` | Role | Notes |
|----------------|----------------|------|--------|
| spaghetti | dish | Dish | Procedure e.g. `combining` (cooking) |
| carbonara | (in `dpp`) | Dish | Has `emissionInformation` (scope1/2/3) |
| Aglio Olio | dish | Dish | Shown in Inventory |
| raw pasta | ingredient | Ingredient | Pasta recipes |
| pasta | ingredient | Ingredient | Pasta recipes |
| tomato sauce | ingredient | Ingredient | Pasta/sauce |
| salt | ingredient | Ingredient | Seasoning |
| pepper | ingredient | Ingredient | Seasoning |
| hot dogs | ingredient | Ingredient | Optional / variant |
| waste water | waste | By-product | Cooking by-product |
| combining | (in `procedure`) | Process | type `cooking`, quantifiableUnit `kg` |

Templates in UI: **Carbonara** (Spaghetti, Cream, Egg; Frying, Boiling), **Aglio Olio** (Spaghetti; Frying, Boiling).

---

### Bowls (template category `bowls`)

| Backend `name` | Backend `type` | Role | Notes |
|----------------|----------------|------|--------|
| Chicken | dish | Dish | Chicken bowl template |
| Beef | dish | Dish | Beef bowl template |
| Pork | dish | Dish | Pork bowl template |
| Rice | ingredient | Ingredient | Common in bowl templates |
| Egg | ingredient | Ingredient | Common in bowl templates |
| Turmeric | ingredient | Ingredient | Common in bowl templates |

Templates in UI: **Chicken**, **Beef**, **Pork** (Rice, Chicken/Beef/Pork, Egg, Turmeric; Frying, Boiling). Backend may return these when present in DB.

---

### Soup (template category `soup`)

| Backend `name` | Backend `type` | Role | Notes |
|----------------|----------------|------|--------|
| Mushroom Soup | dish | Dish | Mushroom Soup template |
| Clam Chowder | dish | Dish | Clam Chowder template |
| Mushrooms | ingredient | Ingredient | Mushroom Soup |
| Cream | ingredient | Ingredient | Both soup templates |
| Stock | ingredient | Ingredient | Mushroom Soup |
| Clams | ingredient | Ingredient | Clam Chowder |
| Potato | ingredient | Ingredient | Clam Chowder |
| Bacon | ingredient | Ingredient | Clam Chowder |

Templates in UI: **Mushroom Soup** (Mushrooms, Cream, Stock; Boiling, Blending), **Clam Chowder** (Clams, Potato, Cream, Bacon; Boiling, Simmering). Backend may return these when present in DB.

---

## 2. Backend document shape (ArangoDB `products` collection)

Each array element typically has:

| Backend field | Type | Frontend use | Notes |
|---------------|------|--------------|--------|
| `id` | string | — | e.g. `"products/1"` |
| `key` | string | `productId` | Update/delete |
| `name` | string | `productName` | Display name |
| `type` | string | `type` | `"dish"` \| `"ingredient"` \| `"waste"` |
| `quantityValue` | number | `productQuantity` | |
| `quantifiableUnit` | string | `productQuantifiableUnit` | e.g. `"kg"` |
| `productOrigin` / `productorigin` | string | `productOrigin` | e.g. `"supplier"` |
| `userId` | string \| null | Filtering | Only matching `userId` shown in Inventory |
| `procedure` | array | — | Processes (e.g. `{ id, name, type: 'cooking' }`) |
| `uploadedFile` | string \| null | `uploadedFile` | BOM filename |
| `emissionInformation` | object | — | scope1, scope2, scope3 (CO2, CH4, N2O) |
| `DPP` | object | LCA + DPP | `DPP.carbonFootprint` for Total LCA |
| `dpp` (alternate) | object | Normalized | Some responses nest name/emissionInformation in `dpp` |

If an item has a top-level **`dpp`** object, the frontend uses **name** = `dpp.name`, **key** from `dpp`, and **emission/DPP** from `dpp.emissionInformation` when top-level fields are missing.

---

## 3. Emission structure (e.g. carbonara)

- **scope1** / **scope2**: e.g. `stationaryCombustion`, `purchasedElectricity`, …
- **scope3**: `category1` … `category15`; each can have `CO2`, `CH4`, `N2O` with `kg`.

Frontend **Total LCA** sums scope1 + scope2 + scope3 from `DPP.carbonFootprint` (or from `emissionInformation` when DPP is absent).

---

## 4. Why the UI shows “4 of 4” but the API returns 16

- The list is **filtered by `userId`**: only items with `userId` equal to the logged-in user appear in the Inventory table.
- So typically **4 items** have `userId` set (e.g. Aglio Olio, Beef, Carbonara, Chicken); the rest (ingredients, waste, or `userId: null`) are still in the response but not shown in the table.

---

## 5. Frontend field mapping (Inventory)

| Backend | → | Frontend (Inventory row) |
|---------|---|---------------------------|
| `key` or `id` (key part) | → | `productId` |
| `name` or `dpp.name` | → | `productName` |
| `quantityValue` | → | `productQuantity` |
| `quantifiableUnit` | → | `productQuantifiableUnit` |
| `functionalProperties.dppData` or `dppData` | → | `dppData` (string) |
| `DPP.carbonFootprint` (scope1+2+3) | → | `lcaResult` → “Total LCA Result” |
| `userId`, `type`, `productOrigin`, `DPP` | → | Kept for actions / DPP view |

To show only **dishes** in the table (and hide ingredients/waste), filter by `type === 'dish'` in addition to `userId`.
