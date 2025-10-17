LCA Calculator Web Application
This is a single-file web application designed to interact with a running openLCA instance through its Inter-Process Communication (IPC) server. It provides a user-friendly interface to browse LCA data, perform calculations, and visualize the results.

Features
Connection Status: Indicates whether the application is successfully connected to the openLCA IPC server.

Data Browsing: Fetches and displays all available Processes and Flows from the active openLCA database.

Filtering and Searching:

Filter the data table by type (Process, Flow, or All).

Search for specific items in both the main data table and the calculation table.

LCA Calculation:

Add processes to a dedicated "Calculation" table.

Specify the amount (e.g., in kg) for each process.

Initiate LCA calculations for the selected impact category (defaults to 'Climate change' using ReCiPe 2016).

Result Visualization:

Impacts Table: View all impact category results in a sortable, interactive table and download the data as a CSV file.

Inventory Table: View detailed inventory results (inputs and outputs) for a calculated process.

Network Graph: Visualize the upstream process contributions as an interactive, force-directed network graph using D3.js.

Raw Data View: Inspect the raw JSON data for the network graph.

Setup and Usage
Prerequisites
An installed and running instance of the openLCA desktop application.

An active database within openLCA.

The IPC Server must be enabled within openLCA. You can start it from the menu: Tools > Developer tools > IPC Server. Ensure it is running on the default port 8080.

Running the Application
Simply open the index.html file in a modern web browser (like Chrome, Firefox, or Edge). The application will automatically attempt to connect to the openLCA IPC server on http://localhost:8080.

OpenLCA API Endpoints Used
The application communicates with the openLCA IPC server using its JSON-RPC API. The following methods are used:

data/get/descriptors: To fetch lists of all available Process, Flow, and ImpactMethod models.

data/get: To retrieve the detailed object for the selected ImpactMethod, including its list of impact categories.

result/calculate: To initiate a new LCA calculation for a specific process with a given amount and impact method.

result/state: To poll the server and check if a calculation is complete.

result/total-impacts: To get the aggregated results for all impact categories after a calculation is finished.

result/total-flows: To retrieve the complete Life Cycle Inventory (LCI) results (inputs and outputs).

result/sankey: To get the nodes and edges data required to build the process contribution graph.

result/dispose: To release the calculation result from memory on the server after the data has been fetched.

Technologies Used
HTML5 & CSS3: For the structure and styling of the application.

JavaScript (ES6+): For all client-side logic and interaction with the openLCA API.

D3.js (v7): For rendering the interactive, force-directed network graph.

Google Charts: For rendering the interactive data tables used to display impact categories and inventory results.