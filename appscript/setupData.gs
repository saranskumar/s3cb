/**
 * Spreadsheet setup helpers for the personal exam command center.
 * These functions stay intentionally lightweight so the sheet remains editable.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Exam Command Center')
    .addItem('Initialize / Repair Schema', 'setupExamCommandCenter')
    .addItem('Reset Progress Logs', 'resetCommandCenterProgress')
    .addToUi();
}

function setupExamCommandCenter() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSchema_(ss);
  seedMissingTrackerData_(ss);

  SpreadsheetApp.getUi().alert(
    'Exam command center ready',
    'The normalized sheets are available and any missing syllabus or plan data has been seeded safely.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function resetCommandCenterProgress() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSchema_(ss);

  clearSheetData_(ss, 'StudySessions');
  clearSheetData_(ss, 'Mocks');
  clearSheetData_(ss, 'RevisionLog');
  clearSheetData_(ss, 'WeakTopics');
  clearSheetData_(ss, 'StudyPlan', [
    'actualMinutes',
    'status',
    'remarks',
    'updatedAt'
  ]);
  clearSheetData_(ss, 'Topics', [
    'status',
    'confidence',
    'revisionCount',
    'notes',
    'lastRevisedDate',
    'assignedDate',
    'completedDate',
    'lastStudiedDate',
    'isWeak',
    'updatedAt'
  ]);

  SpreadsheetApp.getUi().alert(
    'Progress reset',
    'Study logs were cleared and topic/task progress was reset. Subject metadata and syllabus entries were preserved.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function setupComebackTracker() {
  setupExamCommandCenter();
}

function getExamCommandCenterSeed_() {
  return {
    scoreGoal: 70,
    settings: {
      safeBufferMin: 3,
      safeBufferMax: 8,
      dailyStudyGoalMinutes: 300,
      weeklyStudyGoalMinutes: 1800,
      autoCarryOverdueTasks: true,
      poorMockThreshold: 0.55,
      staleRevisionDays: 7,
      examSoonDays: 5,
      criticalPendingLimit: 6,
      dangerReadinessThreshold: 45
    },
    subjects: [
      {
        id: 'maths',
        name: 'Maths',
        code: 'GAMAT401',
        examDate: '2026-04-27',
        internalScored: 31,
        internalTotal: 40,
        externalTotal: 60,
        targetTotal: 70,
        safeExternalMin: 42,
        safeExternalMax: 45,
        priority: 'Score Booster',
        focus: 'Euler, Hamiltonian, Trees, algorithms, and PYQs',
        moduleTitles: ['Graph Basics', 'Connectivity', 'Trees', 'Matrices And Coloring'],
      },
      {
        id: 'ai',
        name: 'AI',
        code: 'PCCMT402',
        examDate: '2026-04-29',
        internalScored: 29,
        internalTotal: 40,
        externalTotal: 60,
        targetTotal: 70,
        safeExternalMin: 42,
        safeExternalMax: 45,
        priority: 'Balanced',
        focus: 'BFS, DFS, A*, minimax, alpha-beta, logic, and planning',
      },
      {
        id: 'os',
        name: 'OS',
        code: 'PCCST403',
        examDate: '2026-05-04',
        internalScored: 26,
        internalTotal: 40,
        externalTotal: 60,
        targetTotal: 70,
        safeExternalMin: 45,
        safeExternalMax: 50,
        priority: 'CRITICAL',
        focus: 'Scheduling, deadlocks, memory, file systems + repeat twice',
      },
      {
        id: 'dbms',
        name: 'DBMS',
        code: 'PBCMT404',
        examDate: '2026-05-07',
        internalScored: 42,
        internalTotal: 50,
        externalTotal: 40,
        targetTotal: 70,
        safeExternalMin: 28,
        safeExternalMax: 32,
        priority: 'Advantage',
        focus: 'SQL, normalization, ER diagrams, and transactions',
      },
      {
        id: 'adsa',
        name: 'ADSA',
        code: 'PECST495',
        examDate: '2026-05-11',
        internalScored: 26,
        internalTotal: 30, // As per 86.7% logic
        externalTotal: 70,
        targetTotal: 70,
        safeExternalMin: 44,
        safeExternalMax: 50,
        priority: 'Score Booster',
        focus: 'Sorting, graphs, complexity, and PYQs heavy',
      },
      {
        id: 'economics',
        name: 'Economics',
        code: 'UCHUT346',
        examDate: '2026-05-14',
        internalScored: 37,
        internalTotal: 50,
        externalTotal: 50,
        targetTotal: 70,
        safeExternalMin: 33,
        safeExternalMax: 40,
        priority: 'Balanced',
        focus: 'Readable long answers, taxation, and writing practice',
      }
    ],
    dailyPlan: [
      { date: '2026-04-17', subjectId: 'maths', title: 'Euler + Hamiltonian Paths', taskType: 'solving', priority: 'high', plannedMinutes: 180, phase: 1 },
      { date: '2026-04-17', subjectId: 'ai', title: 'Intro + Agents Theory', taskType: 'reading', priority: 'medium', plannedMinutes: 60, phase: 1 },
      { date: '2026-04-17', subjectId: 'global', title: 'Output Block: 2 Long Answers', taskType: 'writing', priority: 'high', plannedMinutes: 60, isOutputBlock: true, phase: 1 },

      { date: '2026-04-18', subjectId: 'ai', title: 'BFS, DFS Implementation', taskType: 'solving', priority: 'high', plannedMinutes: 150, phase: 1 },
      { date: '2026-04-18', subjectId: 'maths', title: 'Graph Basics & Properties', taskType: 'revision', priority: 'medium', plannedMinutes: 60, phase: 1 },
      
      { date: '2026-04-19', subjectId: 'ai', title: 'A* & Heuristcs Practice', taskType: 'solving', priority: 'high', plannedMinutes: 150, phase: 1 },
      { date: '2026-04-19', subjectId: 'os', title: 'Process States & Basics', taskType: 'reading', priority: 'medium', plannedMinutes: 60, phase: 1 },
      
      { date: '2026-04-20', subjectId: 'ai', title: 'Minimax + Alpha-Beta', taskType: 'solving', priority: 'critical', plannedMinutes: 150, phase: 1 },
      { date: '2026-04-20', subjectId: 'maths', title: 'PYQ Drill - Graphs', taskType: 'pyq', priority: 'high', plannedMinutes: 90, phase: 1 },
      
      { date: '2026-04-21', subjectId: 'os', title: 'CPU Scheduling Numericals ⚠️', taskType: 'solving', priority: 'critical', plannedMinutes: 180, phase: 1 },
      { date: '2026-04-21', subjectId: 'ai', title: 'Logic Foundations', taskType: 'reading', priority: 'medium', plannedMinutes: 60, phase: 1 },
      
      { date: '2026-04-22', subjectId: 'os', title: 'Deadlocks (Banker\'s Algos)', taskType: 'solving', priority: 'high', plannedMinutes: 150, phase: 1 },
      { date: '2026-04-22', subjectId: 'maths', title: 'Weak Topics Cleanup', taskType: 'revision', priority: 'medium', plannedMinutes: 60, phase: 1 },
      
      { date: '2026-04-23', subjectId: 'dbms', title: 'SQL Practice + ER Diagrams', taskType: 'solving', priority: 'high', plannedMinutes: 150, phase: 1 },
      { date: '2026-04-23', subjectId: 'os', title: 'Memory Management Intro', taskType: 'reading', priority: 'medium', plannedMinutes: 60, phase: 1 },
      
      { date: '2026-04-24', subjectId: 'economics', title: 'Full Syllabus Skim', taskType: 'reading', priority: 'medium', plannedMinutes: 120, phase: 1 },
      { date: '2026-04-24', subjectId: 'os', title: 'Quick Revision Week 1', taskType: 'revision', priority: 'medium', plannedMinutes: 60, phase: 1 },

      // PHASE 2
      { date: '2026-04-25', subjectId: 'maths', title: 'Trees, Prim, Kruskal, Dijkstra', taskType: 'solving', priority: 'critical', plannedMinutes: 180, phase: 2 },
      { date: '2026-04-26', subjectId: 'maths', title: 'FULL PYQ Marathon + Formulas', taskType: 'pyq', priority: 'critical', plannedMinutes: 240, phase: 2 },

      // PHASE 3
      { date: '2026-04-27', subjectId: 'ai', title: 'Diagrams + Concepts (NIGHT ONLY)', taskType: 'revision', priority: 'high', plannedMinutes: 120, phase: 3, timeSlot: 'night' },
      { date: '2026-04-28', subjectId: 'ai', title: 'FULL PYQ Revision Marathon', taskType: 'pyq', priority: 'critical', plannedMinutes: 180, phase: 3 },

      // PHASE 4 (OS Domination - Repeat Cycle)
      { date: '2026-04-29', subjectId: 'os', title: 'Scheduling Full Drill', taskType: 'solving', priority: 'critical', plannedMinutes: 180, isRepeat: true, phase: 4 },
      { date: '2026-04-30', subjectId: 'os', title: 'Deadlocks + Banker\'s Retry', taskType: 'solving', priority: 'critical', plannedMinutes: 180, isRepeat: true, phase: 4 },
      { date: '2026-05-01', subjectId: 'os', title: 'Paging, TLB, Page Faults', taskType: 'solving', priority: 'critical', plannedMinutes: 180, isRepeat: true, phase: 4 },
      { date: '2026-05-02', subjectId: 'os', title: 'File System + I/O Logic', taskType: 'reading', priority: 'high', plannedMinutes: 180, isRepeat: true, phase: 4 },
      { date: '2026-05-03', subjectId: 'os', title: 'FULL MOCK TEST ⚠️', taskType: 'mock', priority: 'critical', plannedMinutes: 210, isRepeat: true, phase: 4 },

      // PHASE 5
      { date: '2026-05-04', subjectId: 'dbms', title: 'SQL Query Patterns (Heavy)', taskType: 'solving', priority: 'high', plannedMinutes: 180, phase: 5 },
      { date: '2026-05-05', subjectId: 'dbms', title: 'Normalization + ER Polish', taskType: 'revision', priority: 'high', plannedMinutes: 150, phase: 5 },
      { date: '2026-05-06', subjectId: 'dbms', title: 'Transactions + Acid Properties', taskType: 'reading', priority: 'medium', plannedMinutes: 120, phase: 5 },

      // PHASE 6
      { date: '2026-05-07', subjectId: 'adsa', title: 'Sorting & Complexity Drill', taskType: 'solving', priority: 'high', plannedMinutes: 180, phase: 6 },
      { date: '2026-05-08', subjectId: 'adsa', title: 'Graph Algos (Master Class)', taskType: 'solving', priority: 'high', plannedMinutes: 180, phase: 6 },
      { date: '2026-05-09', subjectId: 'adsa', title: 'Advanced Data Structures', taskType: 'reading', priority: 'medium', plannedMinutes: 180, phase: 6 },
      { date: '2026-05-10', subjectId: 'adsa', title: 'FULL PYQ Marathon', taskType: 'pyq', priority: 'critical', plannedMinutes: 240, phase: 6 },

      // PHASE 7
      { date: '2026-05-11', subjectId: 'economics', title: 'Demand, Supply & Utility', taskType: 'reading', priority: 'medium', plannedMinutes: 150, phase: 7 },
      { date: '2026-05-12', subjectId: 'economics', title: 'Macro + Taxation Drill', taskType: 'solving', priority: 'high', plannedMinutes: 150, phase: 7 },
      { date: '2026-05-13', subjectId: 'economics', title: 'Long Answers Practice Marathon', taskType: 'writing', priority: 'critical', plannedMinutes: 180, phase: 7 }
    ]

  };
}
