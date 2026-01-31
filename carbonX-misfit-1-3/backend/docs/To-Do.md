Goal: Do LCA for a pasta (pasta->spaghetti, tomato sauce, meatballs -> ... -> salt, pepper, sugar, garlic, hot dogs, onions, tomato paste, olive oil, tomato sauce, water ->)

- [x] Step 1: Create Java objects to map out ingredients

- [x] Step 2: Ensure backend app can run

- [x] Step 3: Create API endpoints and functionality to read database

- [x] Step 4: Create API endpoint to create data into database.
  - [x] implement findByProcessType for ProcessRepository interface
  - [x] implement creation of a LIST of products, processes, inputs, outputs

- [x] Step 5: Create API endpoint to update data into database.

- [x] Step 6: Create a Webclient service to send HTTP requests to the ArangoDB database

- [x] Step 8: Create graph using REST API

- [x] Step 9: Create API endpoints to delete data from database.

- [x] Step 10: Create scripts to automate and standardise test environment for database
  - [x] update constructors, getters & setters for Process class (quantifiableUnit, quantityValue, emissionInformation)

- [ ] Step 11: Create functionality to import CSV and JSON into database
  - [x] I. Create documents for "spaghetti" and "ships" samples
  - [ ] II. Read JSON and CSV documents
  - [ ] III. Import them via HTTP REST API

- [ ] Step 12: Create graph query functionalities over to HTTP REST API

- [ ] Step 13: Re-setup the test environment with more information regarding the nodes and edges  

- [ ] Step 14: Create LCA calculation service
  - [ ] I. Calculate in detail the GWP of each scope using the emission charts
  - [ ] II. Sum them up
  - [ ] III. POST it to the emission information of the DPP

- [ ] Step 15: Create tools and functions to manipulate extracted data from database. Document them in the GitHub page

- [ ] Step 16: ...

Improvements:
- [ ] Create backend HTTP response/request handlers to standardise response format to frontend
- [ ] Create HTTP Response and Request handlers to standardise data format transmition and error codes handling
- [ ] Improve app logger
- [ ] Port all functionalities over to REST API instead of AQL driver?
- [ ] ...