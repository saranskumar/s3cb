/**
 * Creates a custom menu in the spreadsheet to run the tracker setup.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Comeback Plan')
    .addItem('Build My Tracker', 'setupComebackTracker')
    .addToUi();
}

/**
 * Main function to set up the entire multi-sheet study tracker.
 */
function setupComebackTracker() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Define all the data
  const dailyPlanData = [
    ["Done", "Date", "Subject", "Module(s) Focus", "Phase", "IsStudyDay"],
    [false, "Nov 9", "Maths + TOC", "Maths: Mod 1 & start Mod 2, TOC: Mod 1 & start Mod 2", 1, true],
    [false, "Nov 10", "Maths Only", "Maths: Finish Mod 2 & start Mod 3", 1, true],
    [false, "Nov 11", "Maths Only", "Maths: Finish Mod 3 & start Mod 4", 1, true],
    [false, "Nov 12", "Maths Only", "Maths: Review All (Mod 1-4) + Mock Test", 1, true],
    [false, "Nov 13", "MATHS EXAM", "Morning: Final Revision. Afternoon: Rest.", 1, false],
    [false, "Nov 14", "TOC Only", "TOC: Finish Mod 2 & start Mod 3", 1, true],
    [false, "Nov 15", "TOC Only", "TOC: Mod 3 (PDA, CFG, Normal Forms)", 1, true],
    [false, "Nov 16", "TOC Only", "TOC: Mod 4 (Turing, Decidability) + Review", 1, true],
    [false, "Nov 17", "TOC EXAM", "Morning: Final Revision. Afternoon: Chill + Start DSA.", 1, false],
    [false, "Nov 17", "DSA (Start)", "DSA: Mod 1", 2, true],
    [false, "Nov 18", "DSA Only", "DSA: Mod 2 (Linked Lists) & start Mod 3 (Trees)", 2, true],
    [false, "Nov 19", "DSA Only", "DSA: Finish Mod 3 (Graphs) & Mod 4 (Sort/Search)", 2, true],
    [false, "Nov 20", "DSA EXAM", "Morning: Final Revision. Afternoon: Chill + Start Digital.", 2, false],
    [false, "Nov 20", "Digital (Start)", "Digital: Mod 1", 2, true],
    [false, "Nov 21", "ML + Digital", "ML: Mod 1, Digital: Mod 2", 2, true],
    [false, "Nov 22", "ML Only", "ML: Mod 2", 2, true],
    [false, "Nov 23", "ML Only", "ML: Mod 3 & Mod 4", 2, true],
    [false, "Nov 24", "ML EXAM", "Morning: Final Revision. Afternoon: Chill + Digital light.", 2, false],
    [false, "Nov 24", "Digital (Cont.)", "Digital: Review Mod 1 & 2 (Verilog)", 3, true],
    [false, "Nov 25", "Digital Only", "Digital: Mod 3 (Combinational, MSI)", 3, true],
    [false, "Nov 26", "Digital Only", "Digital: Mod 4 (Sequential, FSM)", 3, true],
    [false, "Nov 27", "DIGITAL EXAM", "Morning: Final Revision. Afternoon: Chill + Start Ethics.", 3, false],
    [false, "Nov 27", "Ethics (Start)", "Ethics: Mod 1 & start Mod 2", 3, true],
    [false, "Nov 28", "Ethics Only", "Ethics: Finish Mod 2, 3, & 4", 3, true],
    [false, "Nov 29", "ETHICS EXAM", "Morning: Final Revision.", 3, false],
    [false, "Nov 30", "DONE", "Freedom. Earned.", 3, false]
  ];

  const subjectData = {
    "Maths_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Random variables"],
      [false, 1, "Discrete random variables & probability distributions"],
      [false, 1, "Cumulative distribution function (Discrete)"],
      [false, 1, "Expectation, Mean, and variance (Discrete)"],
      [false, 1, "Binomial probability distribution"],
      [false, 1, "Poisson probability distribution"],
      [false, 1, "Poisson as a limit of binomial"],
      [false, 1, "Joint pmf of two discrete random variables"],
      [false, 1, "Marginal pmf"],
      [false, 1, "Independent random variables"],
      [false, 1, "Expected value of a function of two discrete variables"],
      [false, 2, "Continuous random variables & probability distributions"],
      [false, 2, "Cumulative distribution function (Continuous)"],
      [false, 2, "Expectation, Mean, and variance (Continuous)"],
      [false, 2, "Uniform distribution"],
      [false, 2, "Normal distribution"],
      [false, 2, "Exponential distributions"],
      [false, 2, "Joint pdf of two Continuous random variables"],
      [false, 2, "Marginal pdf"],
      [false, 2, "Independent random variables"],
      [false, 2, "Expectation value of a function of two continuous variables"],
      [false, 3, "Limit theorems: Markov's Inequality"],
      [false, 3, "Limit theorems: Chebyshev's Inequality"],
      [false, 3, "Limit theorems: Strong Law of Large Numbers (Without proof)"],
      [false, 3, "Limit theorems: Central Limit Theorem (without proof)"],
      [false, 3, "Stochastic Processes: Discrete-time & Continuous-time"],
      [false, 3, "Stochastic Processes: Counting Processes"],
      [false, 3, "Stochastic Processes: The Poisson Process"],
      [false, 3, "Stochastic Processes: Interarrival times (Theorems without proof)"],
      [false, 4, "Markov Chains"],
      [false, 4, "Random Walk Model"],
      [false, 4, "Chapman-Kolmogorov Equations"],
      [false, 4, "Classification of States"],
      [false, 4, "Irreducible Markov chain"],
      [false, 4, "Recurrent state"],
      [false, 4, "Transient state"],
      [false, 4, "Long-Run Proportions (Theorems without proof)"]
    ],
    "TOC_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Foundations: Motivation, Models, Alphabet, Strings, Languages"],
      [false, 1, "Finite Automata: Deterministic Finite Automata (DFA)"],
      [false, 1, "Finite Automata: Regular languages"],
      [false, 1, "Finite Automata: Nondeterministic Finite Automata (NFA)"],
      [false, 1, "Finite Automata: NFA with epsilon transitions"],
      [false, 1, "Finite Automata: Eliminating epsilon transitions"],
      [false, 1, "Finite Automata: Equivalence of NFAs and DFAs (Subset Construction)"],
      [false, 1, "Finite Automata: DFA State Minimization"],
      [false, 1, "Finite Automata: Applications (text search, keyword recognition)"],
      [false, 2, "Regular Expressions: Formal definition"],
      [false, 2, "Regular Expressions: Building REs"],
      [false, 2, "Regular Expressions: Equivalence with FA (FA to RE, RE to FA)"],
      [false, 2, "Regular Expressions: Pattern Matching"],
      [false, 2, "Regular Grammar: Equivalence with FA"],
      [false, 2, "Properties of Regular Languages: Closure & Decision Properties"],
      [false, 2, "Properties of Regular Languages: Pumping Lemma"],
      [false, 2, "Properties of Regular Languages: Using Pumping Lemma to prove non-regularity"],
      [false, 2, "Context-Free Grammars (CFG): Formal definition"],
      [false, 2, "Context-Free Grammars (CFG): Designing CFGs"],
      [false, 2, "Context-Free Grammars (CFG): Leftmost & Rightmost Derivations"],
      [false, 2, "Context-Free Grammars (CFG): Parse Trees"],
      [false, 2, "Context-Free Grammars (CFG): Ambiguous Grammars, Resolving ambiguity, Inherent ambiguity"],
      [false, 3, "Pushdown Automata (PDA): Formal definition"],
      [false, 3, "Pushdown Automata (PDA): DPDA and NPDA, Examples"],
      [false, 3, "Pushdown Automata (PDA): Equivalence of NPDAs and CFGs"],
      [false, 3, "Simplification of CFLs: Elimination of useless symbols & productions"],
      [false, 3, "Simplification of CFLs: Eliminating epsilon productions"],
      [false, 3, "Simplification of CFLs: Eliminating unit productions"],
      [false, 3, "Simplification of CFLs: Chomsky Normal Form (CNF)"],
      [false, 3, "Simplification of CFLs: Greibach Normal Form (GNF)"],
      [false, 3, "Properties of CFLs: Pumping Lemma for CFLs"],
      [false, 3, "Properties of CFLs: Closure & Decision Properties"],
      [false, 4, "Turing Machines (TM): Formal definition"],
      [false, 4, "Turing Machines (TM): Examples (Language acceptors, Function computers)"],
      [false, 4, "Turing Machines (TM): Variants of TMs"],
      [false, 4, "Turing Machines (TM): Recursive and recursively enumerable languages"],
      [false, 4, "Chomskian hierarchy"],
      [false, 4, "Linear Bounded Automaton (LBA)"],
      [false, 4, "Computability: Church-Turing thesis"],
      [false, 4, "Computability: Encoding of TMs, Universal Machine, Diagonalization"],
      [false, 4, "Computability: Reductions"],
      [false, 4, "Computability: Decidable and Undecidable Problems"],
      [false, 4, "Computability: Halting problem (Proof of undecidability)"],
      [false, 4, "Computability: Post Correspondence Problem (PCP) (Proof of undecidability)"]
    ],
    "DSA_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Basic Concepts: Data Abstraction, Performance Analysis (Time & Space)"],
      [false, 1, "Basic Concepts: Asymptotic Notations (Big O, Omega, Theta)"],
      [false, 1, "Polynomial representation using Arrays"],
      [false, 1, "Sparse matrix (Tuple representation)"],
      [false, 1, "Stacks & Multi-Stacks"],
      [false, 1, "Queues & Circular Queues"],
      [false, 1, "Double Ended Queues (DEQs)"],
      [false, 1, "Evaluation of Expressions: Infix to Postfix"],
      [false, 1, "Evaluation of Expressions: Evaluating Postfix Expressions"],
      [false, 2, "Singly Linked List: Operations"],
      [false, 2, "Singly Linked List: Stacks and Queues using Linked List"],
      [false, 2, "Singly Linked List: Polynomial representation using Linked List"],
      [false, 2, "Doubly Linked List"],
      [false, 2, "Circular Linked List"],
      [false, 2, "Memory allocation: First-fit, Best-fit, Worst-fit"],
      [false, 2, "Garbage collection and compaction"],
      [false, 3, "Trees: Representation, Binary Trees (Types, Properties)"],
      [false, 3, "Trees: Binary Tree Representation"],
      [false, 3, "Trees: Tree Operations & Traversals (Inorder, Preorder, Postorder)"],
      [false, 3, "Trees: Expression Trees"],
      [false, 3, "Binary Search Trees (BST): Operations (Search, Insert, Delete)"],
      [false, 3, "Binary Heaps: Operations, Priority Queue"],
      [false, 3, "Graphs: Definitions"],
      [false, 3, "Graphs: Representation (Adjacency Matrix, Adjacency List)"],
      [false, 3, "Graphs: Depth First Search (DFS)"],
      [false, 3, "Graphs: Breadth First Search (BFS)"],
      [false, 3, "Graphs: Applications (Single Source All Destination)"],
      [false, 4, "Sorting: Selection Sort"],
      [false, 4, "Sorting: Insertion Sort"],
      [false, 4, "Sorting: Quick Sort"],
      [false, 4, "Sorting: Merge Sort"],
      [false, 4, "Sorting: Heap Sort"],
      [false, 4, "Sorting: Radix Sort"],
      [false, 4, "Searching: Linear Search"],
      [false, 4, "Searching: Binary Search"],
      [false, 4, "Hashing: Hashing functions (Mid square, Division, Folding, Digit Analysis)"],
      [false, 4, "Hashing: Collision Resolution (Linear probing)"],
      [false, 4, "Hashing: Collision Resolution (Quadratic Probing)"],
      [false, 4, "Hashing: Collision Resolution (Double hashing)"],
      [false, 4, "Hashing: Collision Resolution (Open hashing / Chaining)"]
    ],
    "ML_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Introduction: ML vs. Traditional Programming"],
      [false, 1, "Paradigms: Supervised, Semi-supervised, Unsupervised, Reinforcement"],
      [false, 1, "Parameter Estimation: Maximum Likelihood Estimation (MLE)"],
      [false, 1, "Parameter Estimation: Maximum Aposteriori Estimation (MAP)"],
      [false, 1, "Parameter Estimation: Bayesian formulation"],
      [false, 1, "Supervised Learning: Feature Representation, Problem Formulation"],
      [false, 1, "Supervised Learning: Loss functions and optimization"],
      [false, 1, "Regression: Linear regression with one variable"],
      [false, 1, "Regression: Linear regression with multiple variables"],
      [false, 1, "Regression: Gradient descent algorithm"],
      [false, 1, "Regression: Matrix method"],
      [false, 2, "Classification: Naive Bayes"],
      [false, 2, "Classification: K-Nearest Neighbors (KNN)"],
      [false, 2, "Generalisation: Idea of overfitting"],
      [false, 2, "Generalisation: LASSO and RIDGE regularization"],
      [false, 2, "Generalisation: Training, Testing, Validation sets"],
      [false, 2, "Evaluation Measures (Classification): Precision, Recall, Accuracy, F-Measure"],
      [false, 2, "Evaluation Measures (Classification): Receiver Operating Characteristic (ROC) Curve"],
      [false, 2, "Evaluation Measures (Classification): Area Under Curve (AUC)"],
      [false, 2, "Evaluation Measures (Regression): Mean Absolute Error (MAE)"],
      [false, 2, "Evaluation Measures (Regression): Root Mean Squared Error (RMSE)"],
      [false, 2, "Evaluation Measures (Regression): R-Squared / Coefficient of Determination"],
      [false, 3, "Neural Networks (NN): Perceptron"],
      [false, 3, "Neural Networks (NN): Multilayer feed-forward network"],
      [false, 3, "Neural Networks (NN): Activation functions (Sigmoid, ReLU, Tanh)"],
      [false, 3, "Neural Networks (NN): Backpropagation algorithm"],
      [false, 3, "NN Issues: Vanishing/Exploding Gradient, Local Minima, Overfitting, etc."],
      [false, 3, "NN Issues: Adaptive Learning Rate Methods (Momentum, ADAGRAD, RMSProp, ADAM)"],
      [false, 3, "Decision Trees: Information Gain"],
      [false, 3, "Decision Trees: Gain Ratio"],
      [false, 3, "DecisionTrees: ID3 algorithm"],
      [false, 4, "Clustering: Similarity measures"],
      [false, 4, "Clustering: Hierarchical Clustering (Agglomerative)"],
      [false, 4, "Clustering: Partitional clustering"],
      [false, 4, "Clustering: K-means clustering"],
      [false, 4, "Dimensionality reduction: Principal Component Analysis (PCA)"],
      [false, 4, "Dimensionality reduction: Multidimensional scaling"],
      [false, 4, "Ensemble methods: Bagging"],
      [false, 4, "Ensemble methods: Boosting"],
      [false, 4, "Resampling methods: Bootstrapping"],
      [false, 4, "Resampling methods: Cross Validation"],
      [false, 4, "Practical aspects: Bias-Variance trade-off"]
    ],
    "Digital_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Introduction to digital Systems: Digital abstraction"],
      [false, 1, "Number Systems: Binary, Hexadecimal, Base conversion"],
      [false, 1, "Binary Arithmetic: Addition, Subtraction, Unsigned, Signed"],
      [false, 1, "Number Systems: Fixed-Point & Floating-Point"],
      [false, 1, "Basic gates: Buffer, Inverter, AND, OR, NOR, NAND, XOR, XNOR"],
      [false, 1, "Digital circuit operation: Logic levels, DC specs, Noise margins"],
      [false, 1, "Digital circuit operation: Driving loads (gates, resistive, LEDs)"],
      [false, 1, "Verilog (Part 1): HDL Abstraction, Design flow"],
      [false, 1, "Verilog (Part 1): Constructs (data types, module, operators)"],
      [false, 2, "Combinational Logic: Boolean Algebra (Operations, Axioms, Theorems)"],
      [false, 2, "Combinational Logic: Analysis (Canonical SOP and POS)"],
      [false, 2, "Combinational Logic: Minterm and Maxterm equivalence"],
      [false, 2, "Logic minimization: Algebraic minimization"],
      [false, 2, "Logic minimization: K-map minimization, Don't cares"],
      [false, 2, "Combinational Logic: Code convertors"],
      [false, 2, "Verilog (Part 2): Continuous assignment (with logical operators)"],
      [false, 2, "Verilog (Part 2): Continuous assignment (with conditional operators)"],
      [false, 2, "Verilog (Part 2): Continuous assignment (with delay)"],
      [false, 3, "MSI Logic: Decoders (One-Hot, 7 segment display)"],
      [false, 3, "MSI Logic: Encoders"],
      [false, 3, "MSI Logic: Multiplexers (Mux)"],
      [false, 3, "MSI Logic: Demultiplexers (Demux)"],
      [false, 3, "Digital Building Blocks: Arithmetic Circuits (Half/Full adder)"],
      [false, 3, "Digital Building Blocks: Arithmetic Circuits (Half/Full subtractor)"],
      [false, 3, "Digital Building Blocks: Comparators"],
      [false, 3, "Verilog (Part 3): Structural design & hierarchy"],
      [false, 3, "Verilog (Part 3): Lower level module instantiation"],
      [false, 3, "Verilog (Part 3): Gate level primitives, User defined primitives (UDP)"],
      [false, 3, "Verilog (Part 3): Adding delay to primitives"],
      [false, 4, "Sequential Logic: Latches & Flip-Flops (SR latch, SR latch w/ enable)"],
      [false, 4, "Sequential Logic: Latches & Flip-Flops (JK flipflop, D flipflop)"],
      [false, 4, "Sequential Logic: Register (Enabled, Resettable Flip-Flop)"],
      [false, 4, "Sequential Logic: Timing considerations"],
      [false, 4, "Common circuits: Toggle flop clock divider"],
      [false, 4, "Common circuits: Asynchronous ripple counter"],
      [false, 4, "Common circuits: Shift register"],
      [false, 4, "Finite State Machines (FSM): Logic synthesis for an FSM"],
      [false, 4, "Finite State Machines (FSM): FSM design process and examples"],
      [false, 4, "Synchronous Sequential Circuits: Counters"],
      [false, 4, "Verilog (Part 4): Procedural assignment"],
      [false, 4, "Verilog (Part 4): Conditional Programming constructs (if, case)"],
      [false, 4, "Verilog (Part 4): Test benches"],
      [false, 4, "Verilog (Part 4): Modeling a D flipflop"],
      [false, 4, "Verilog (Part 4): Modeling an FSM"]
    ],
    "Ethics_Tracker": [
      ["Done", "Module", "Topic"],
      [false, 1, "Fundamentals: Personal vs. professional ethics, Civic Virtue"],
      [false, 1, "Fundamentals: Respect for others, Profession, Professionalism"],
      [false, 1, "Fundamentals: Ingenuity, diligence, responsibility"],
      [false, 1, "Fundamentals: Integrity in design, development, research"],
      [false, 1, "Fundamentals: Plagiarism"],
      [false, 1, "Fundamentals: Balanced outlook on law challenges, Case studies"],
      [false, 1, "Technology/Digital: Data, information, knowledge"],
      [false, 1, "Technology/Digital: Cybertrust and cybersecurity"],
      [false, 1, "Technology/Digital: Data collection & management"],
      [false, 1, "Technology/Digital: High technologies (accessibility, social impacts)"],
      [false, 1, "Professional Practice: Managing conflict, Collective bargaining"],
      [false, 1, "Professional Practice: Confidentiality, Role in moral integrity"],
      [false, 1, "Professional Practice: Codes of Ethics"],
      [false, 2, "Gender Studies: Sex, gender, sexuality, gender spectrum (beyond binary)"],
      [false, 2, "Gender Studies: Gender identity, gender expression, gender stereotypes"],
      [false, 2, "Gender Studies: Gender disparity & discrimination (education, employment)"],
      [false, 2, "Gender Studies: History of women in Science & Technology"],
      [false, 2, "Gender Studies: Gendered technologies & innovations"],
      [false, 2, "Gender Studies: Ethical values (gender equity, diversity, justice)"],
      [false, 2, "Gender Studies: Gender policy, women/transgender empowerment"],
      [false, 2, "Environmental Ethics: Definition, importance, history"],
      [false, 2, "Environmental Ethics: Key philosophical theories (anthropo, bio, ecocentrism)"],
      [false, 2, "Sustainable Engineering: Definition, scope, triple bottom line (TBL)"],
      [false, 2, "Sustainable Engineering: Life cycle analysis (LCA), sustainability metrics"],
      [false, 2, "Ecosystems: Basics, Biodiversity, Conservation, Human impact"],
      [false, 2, "Ecosystems: Overview of ecosystems in Kerala/India"],
      [false, 2, "Landscape/Urban Ecology: Principles, Urbanization impact"],
      [false,2, "Landscape/Urban Ecology: Sustainable urban planning, green infrastructure"],
      [false, 3, "Hydrology/Water: Basics of hydrology, water cycle"],
      [false, 3, "Hydrology/Water: Water scarcity, pollution issues"],
      [false, 3, "Hydrology/Water: Sustainable water management, Environmental flow"],
      [false, 3, "Zero Waste: Definition, principles, Strategies (RRR)"],
      [false, 3, "Zero Waste: Case studies of successful initiatives"],
      [false, 3, "Circular Economy/Degrowth: Intro to circular model, Linear vs Circular"],
      [false, 3, "Circular Economy/Degrowth: Degrowth principles, Implementation strategies"],
      [false, 3, "Mobility: Impacts of transportation (environment, climate)"],
      [false, 3, "Mobility: Sustainable Transportation design, Urban mobility solutions"],
      [false, 3, "Mobility: Integrated mobility systems, E-Mobility"],
      [false, 4, "Renewable Energy: Overview of sources (solar, wind, hydro, biomass)"],
      [false, 4, "Renewable Energy: Sustainable technologies (production, consumption)"],
      [false, 4, "Renewable Energy: Challenges and opportunities"],
      [false, 4, "Climate Change: Basics of climate science"],
      [false, 4, "Climate Change: Impact on natural and human systems"],
      [false, 4, "Climate Change: Kerala/India and the Climate crisis"],
      [false, 4, "Climate Change: Engineering solutions (mitigate, adapt, resilience)"],
      [false, 4, "Environmental Policies: Overview (national, international)"],
      [false, 4, "Environmental Policies: Role of engineers in implementation, compliance"],
      [false, 4, "Environmental Policies: Ethical considerations in policy-making"],
      [false, 4, "Case Studies: Analysis of real-world case studies"],
      [false, 4, "Future Directions: Emerging trends in environmental ethics/sustainability"]
    ]
  };

  // 2. Clear existing sheets (except the first one if it's new)
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }
  
  // 3. Create Daily Plan sheet
  const planSheet = ss.insertSheet('Daily_Plan', 0);
  populateSheet(planSheet, dailyPlanData);
  planSheet.getRange('A2:A' + planSheet.getLastRow()).insertCheckboxes();
  planSheet.setFrozenRows(1);
  planSheet.autoResizeColumns(1, 4);

  // Add the progress meter
  planSheet.getRange('H2').setValue('Comeback Meter');
  planSheet.getRange('H3').setFormula('=COUNTIF(A2:A27, TRUE) & " / " & COUNTIF(F2:F27, TRUE)');
  planSheet.getRange('H4').setFormula('=SPARKLINE(COUNTIF(A2:A27, TRUE) / COUNTIF(F2:F27, TRUE), {"charttype","bar";"max",1})');
  planSheet.getRange('H2:H4').setFontWeight('bold');

  // 4. Create Subject Tracker sheets
  for (const sheetName in subjectData) {
    const data = subjectData[sheetName];
    const sheet = ss.insertSheet(sheetName);
    populateSheet(sheet, data);
    sheet.getRange('A2:A' + sheet.getLastRow()).insertCheckboxes();
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 3);
  }
  
  SpreadsheetApp.getUi().alert('Success!', 'Your Comeback Tracker has been built.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Helper function to populate a sheet with 2D array data.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet object.
 * @param {Array<Array<any>>} data The 2D array of data.
 */
function populateSheet(sheet, data) {
  const numRows = data.length;
  const numCols = data[0].length;
  sheet.getRange(1, 1, numRows, numCols).setValues(data);
  sheet.getRange(1, 1, 1, numCols).setFontWeight('bold');
}

// --- API FUNCTIONS ---
// These functions allow your PWA to read and write data.

/**
 * Handles GET requests to the web app.
 * Fetches all data from all sheets and returns it as JSON.
 * This function runs when your PWA loads.
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const data = {};

  for (let sheet of sheets) {
    const sheetName = sheet.getName();
    const values = sheet.getDataRange().getValues();
    data[sheetName] = values;
  }

  // Add CORS headers
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handles POST requests to the web app.
 * Can now handle "toggleCheckbox" or "addTopic" actions.
 */
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;

  try {
    // --- ACTION 1: TOGGLE A CHECKBOX ---
    if (action === 'toggleCheckbox') {
      const { sheetName, rowIndex, value } = payload;
      
      // Note: The UI sends a 0-indexed data row.
      // We add 2 to convert to a 1-indexed sheet row (row 1 is header, so data starts row 2).
      const sheetRow = rowIndex + 2; 
      const sheetCol = 1; // Column A (Done)

      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error("Sheet not found: " + sheetName);
      }
      
      // Set the new value in the checkbox column
      sheet.getRange(sheetRow, sheetCol).setValue(value);

      // Return a success message
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "toggle",
        sheet: sheetName,
        row: sheetRow,
        value: value
      })).setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // --- ACTION 2: ADD A NEW TOPIC ---
    } else if (action === 'addTopic') {
      const { sheetName, moduleNum, topicName } = payload;
      
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error("Sheet not found: " + sheetName);
      }

      // Append the new row to the end of the sheet
      // It will have "FALSE" in col A, the module #, and the new topic name
      sheet.appendRow([false, moduleNum, topicName]);

      // Return a success message
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "add",
        sheet: sheetName,
        topic: topicName
      })).setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    } else {
      // Handle any unknown actions
      throw new Error("Invalid action provided: " + action);
    }

  } catch (err) {
    // Return an error message
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

/**
 * NEW FUNCTION: Handles CORS Pre-flight (OPTIONS) requests.
 * This MUST be added for your PWA to be allowed to send POST requests.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .withHeaders({
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    .setMimeType(ContentService.MimeType.TEXT);
}