/**
 * Apps Script API for the personal exam command center.
 * The API keeps the sheet model readable and adds lightweight exam logic.
 */

var SCHEMA_VERSION_ = '2026-04-command-center';
var DEFAULT_TIMEZONE_ = 'Asia/Kolkata';

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSchema_(ss);
  seedMissingTrackerData_(ss);

  var action = getActionParam_(e);

  try {
    if (!action) {
      return jsonResponse_(getLegacySheetDump_(ss));
    }

    if (action === 'getAppData') {
      return jsonResponse_(buildAppData_(ss));
    }

    if (action === 'getDashboard') {
      return jsonResponse_(buildDashboardPayload_(readDataset_(ss)));
    }

    if (action === 'getSubjects') {
      return jsonResponse_({ subjects: decorateSubjects_(readDataset_(ss)) });
    }

    if (action === 'getSubjectById') {
      return jsonResponse_(buildSubjectPayload_(readDataset_(ss), getParam_(e, 'subjectId')));
    }

    if (action === 'getTopics') {
      return jsonResponse_(buildTopicsPayload_(readDataset_(ss), e));
    }

    if (action === 'getPlan') {
      return jsonResponse_(buildPlanPayload_(readDataset_(ss), e));
    }

    if (action === 'getAnalytics') {
      return jsonResponse_(buildAnalyticsPayload_(readDataset_(ss)));
    }

    throw new Error('Unsupported action: ' + action);
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.message
    });
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSchema_(ss);
  seedMissingTrackerData_(ss);

  try {
    var payload = parsePayload_(e);
    var result = handleAction_(ss, payload);
    return jsonResponse_(Object.assign({ status: 'success' }, result));
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.message
    });
  }
}

function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function handleAction_(ss, payload) {
  var action = payload.action;

  if (!action) {
    throw new Error('Missing action.');
  }

  if (action === 'updateSubject') {
    return updateSubject_(ss, payload);
  }
  if (action === 'updateTopic') {
    return updateTopic_(ss, payload);
  }
  if (action === 'createTask') {
    return createTask_(ss, payload);
  }
  if (action === 'updateTask') {
    return updateTask_(ss, payload);
  }
  if (action === 'logSession') {
    return logSession_(ss, payload);
  }
  if (action === 'addMock') {
    return addMock_(ss, payload);
  }
  if (action === 'updateRevision') {
    return updateRevision_(ss, payload);
  }
  if (action === 'updateSettings') {
    return updateSettings_(ss, payload);
  }
  if (action === 'upsertWeakTopic') {
    return upsertWeakTopic_(ss, payload);
  }

  throw new Error('Invalid action: ' + action);
}

function buildAppData_(ss) {
  var dataset = readDataset_(ss);
  return {
    status: 'success',
    schemaVersion: SCHEMA_VERSION_,
    generatedAt: nowIso_(),
    settings: dataset.settings,
    subjects: decorateSubjects_(dataset),
    modules: dataset.modules,
    topics: dataset.topics,
    tasks: dataset.tasks,
    sessions: dataset.sessions,
    mocks: dataset.mocks,
    revisions: dataset.revisions,
    weakTopics: dataset.weakTopics,
    dashboard: buildDashboardPayload_(dataset),
    analytics: buildAnalyticsPayload_(dataset)
  };
}

function buildDashboardPayload_(dataset) {
  var subjects = decorateSubjects_(dataset);
  var todayKey = getTodayKey_();
  var overdueTasks = dataset.tasks.filter(function(task) {
    return !isCompletedTask_(task) && task.date && task.date < todayKey;
  });
  var todaysTasks = dataset.tasks.filter(function(task) {
    return !isCompletedTask_(task) && task.date === todayKey;
  });
  var recentSessions = dataset.sessions
    .slice()
    .sort(function(a, b) {
      return compareDateDesc_(a.date, b.date) || compareNumberDesc_(a.createdAt, b.createdAt);
    })
    .slice(0, 8)
    .map(function(session) {
      return decorateSession_(session, dataset.subjectMap, dataset.topicMap);
    });
  var weakTopics = dataset.weakTopics
    .slice()
    .sort(function(a, b) {
      return severityRank_(b.severity) - severityRank_(a.severity);
    })
    .slice(0, 6)
    .map(function(item) {
      return decorateWeakTopic_(item, dataset.subjectMap, dataset.topicMap);
    });
  var nextExam = subjects
    .filter(function(subject) {
      return safeNumber_(subject.daysToExam, 9999) >= 0;
    })
    .sort(function(a, b) {
      return safeNumber_(a.daysToExam, 9999) - safeNumber_(b.daysToExam, 9999);
    })[0] || null;
  var hoursToday = minutesToHours_(sumBy_(dataset.sessions, function(session) {
    return session.date === todayKey ? safeNumber_(session.minutes) : 0;
  }));
  var weeklyCutoff = shiftDateKey_(todayKey, -6);
  var hoursWeek = minutesToHours_(sumBy_(dataset.sessions, function(session) {
    return session.date >= weeklyCutoff && session.date <= todayKey ? safeNumber_(session.minutes) : 0;
  }));
  var totalTopics = dataset.topics.length;
  var completedTopics = dataset.topics.filter(isCompletedTopic_).length;
  var totalRevisionCount = sumBy_(dataset.topics, function(topic) {
    return safeNumber_(topic.revisionCount);
  });
  var mockTestsCompleted = dataset.mocks.length;
  var plannedToday = sumBy_(dataset.tasks, function(task) {
    return task.date === todayKey ? safeNumber_(task.plannedMinutes) : 0;
  });
  var actualToday = sumBy_(dataset.tasks, function(task) {
    return task.date === todayKey ? safeNumber_(task.actualMinutes) : 0;
  });

  return {
    today: todayKey,
    nextExam: nextExam,
    examCountdowns: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        examDate: subject.examDate,
        daysToExam: subject.daysToExam,
        readiness: subject.readiness
      };
    }).sort(function(a, b) {
      return safeNumber_(a.daysToExam, 9999) - safeNumber_(b.daysToExam, 9999);
    }),
    todaysTasks: todaysTasks.map(function(task) {
      return decorateTask_(task, dataset.subjectMap, dataset.topicMap, dataset.moduleMap);
    }),
    overallReadiness: averageRounded_(subjects, 'readiness'),
    totalTopicsCompleted: completedTopics,
    totalTopicsPending: Math.max(totalTopics - completedTopics, 0),
    dailyStudyProgress: {
      plannedMinutes: plannedToday,
      actualMinutes: actualToday,
      percentage: plannedToday > 0 ? clamp_(Math.round((actualToday / plannedToday) * 100), 0, 100) : 0
    },
    subjectWiseProgress: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        completionPct: subject.completionPct,
        readiness: subject.readiness
      };
    }),
    dangerSubject: subjects.slice().sort(function(a, b) {
      return dangerScore_(b) - dangerScore_(a);
    })[0] || null,
    scoringSubject: subjects.slice().sort(function(a, b) {
      return scoringScore_(b) - scoringScore_(a);
    })[0] || null,
    recentSessions: recentSessions,
    overdueTasks: overdueTasks.map(function(task) {
      return decorateTask_(task, dataset.subjectMap, dataset.topicMap, dataset.moduleMap);
    }),
    weakTopics: weakTopics,
    totalRevisionCount: totalRevisionCount,
    mockTestsCompleted: mockTestsCompleted,
    hoursStudiedToday: hoursToday,
    hoursStudiedWeek: hoursWeek
  };
}

function buildAnalyticsPayload_(dataset) {
  var subjects = decorateSubjects_(dataset);
  var todayKey = getTodayKey_();
  var lastSevenDays = [];
  var i;

  for (i = 6; i >= 0; i -= 1) {
    lastSevenDays.push(shiftDateKey_(todayKey, -i));
  }

  return {
    subjectCompletion: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        completionPct: subject.completionPct
      };
    }),
    topicsSummary: {
      completed: dataset.topics.filter(isCompletedTopic_).length,
      pending: dataset.topics.filter(function(topic) { return !isCompletedTopic_(topic); }).length,
      inProgress: dataset.topics.filter(function(topic) { return topic.status === 'in_progress'; }).length,
      mastered: dataset.topics.filter(function(topic) { return topic.status === 'mastered'; }).length
    },
    revisionBySubject: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        revisionCount: subject.revisionCount
      };
    }),
    hoursByDay: lastSevenDays.map(function(dayKey) {
      return {
        date: dayKey,
        minutes: sumBy_(dataset.sessions, function(session) {
          return session.date === dayKey ? safeNumber_(session.minutes) : 0;
        })
      };
    }),
    hoursBySubject: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        minutes: sumBy_(dataset.sessions, function(session) {
          return session.subjectId === subject.id ? safeNumber_(session.minutes) : 0;
        })
      };
    }),
    plannedVsActual: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        plannedMinutes: sumBy_(dataset.tasks, function(task) {
          return task.subjectId === subject.id ? safeNumber_(task.plannedMinutes) : 0;
        }),
        actualMinutes: sumBy_(dataset.tasks, function(task) {
          return task.subjectId === subject.id ? safeNumber_(task.actualMinutes) : 0;
        })
      };
    }),
    readinessBySubject: subjects.map(function(subject) {
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        readiness: subject.readiness,
        riskLevel: subject.riskLevel
      };
    }),
    mocksSummary: subjects.map(function(subject) {
      var subjectMocks = dataset.mocks.filter(function(mock) {
        return mock.subjectId === subject.id;
      });
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        count: subjectMocks.length,
        averageScorePct: getAverageMockPct_(subjectMocks)
      };
    })
  };
}

function buildSubjectPayload_(dataset, subjectId) {
  var subjects = decorateSubjects_(dataset);
  var subject = subjects.filter(function(item) {
    return item.id === subjectId;
  })[0];

  if (!subject) {
    throw new Error('Subject not found: ' + subjectId);
  }

  return {
    subject: subject,
    modules: dataset.modules.filter(function(module) {
      return module.subjectId === subjectId;
    }),
    topics: dataset.topics.filter(function(topic) {
      return topic.subjectId === subjectId;
    }),
    tasks: dataset.tasks.filter(function(task) {
      return task.subjectId === subjectId;
    }),
    sessions: dataset.sessions.filter(function(session) {
      return session.subjectId === subjectId;
    }),
    mocks: dataset.mocks.filter(function(mock) {
      return mock.subjectId === subjectId;
    }),
    revisions: dataset.revisions.filter(function(revision) {
      return revision.subjectId === subjectId;
    }),
    weakTopics: dataset.weakTopics.filter(function(item) {
      return item.subjectId === subjectId;
    })
  };
}

function buildTopicsPayload_(dataset, e) {
  var subjectId = getParam_(e, 'subjectId');
  var moduleId = getParam_(e, 'moduleId');

  return {
    topics: dataset.topics.filter(function(topic) {
      if (subjectId && topic.subjectId !== subjectId) {
        return false;
      }
      if (moduleId && topic.moduleId !== moduleId) {
        return false;
      }
      return true;
    })
  };
}

function buildPlanPayload_(dataset, e) {
  var subjectId = getParam_(e, 'subjectId');
  var status = getParam_(e, 'status');
  var date = getParam_(e, 'date');

  return {
    tasks: dataset.tasks.filter(function(task) {
      if (subjectId && task.subjectId !== subjectId) {
        return false;
      }
      if (status && task.status !== status) {
        return false;
      }
      if (date && task.date !== date) {
        return false;
      }
      return true;
    }).map(function(task) {
      return decorateTask_(task, dataset.subjectMap, dataset.topicMap, dataset.moduleMap);
    })
  };
}

function decorateSubjects_(dataset) {
  return dataset.subjects.map(function(subject) {
    return decorateSubject_(subject, dataset);
  });
}

function decorateSubject_(subject, dataset) {
  var settings = dataset.settings;
  var topics = dataset.topics.filter(function(topic) {
    return topic.subjectId === subject.id;
  });
  var tasks = dataset.tasks.filter(function(task) {
    return task.subjectId === subject.id;
  });
  var mocks = dataset.mocks.filter(function(mock) {
    return mock.subjectId === subject.id;
  });
  var weakTopics = dataset.weakTopics.filter(function(item) {
    return item.subjectId === subject.id;
  });
  var totalTopics = topics.length;
  var completedTopics = topics.filter(isCompletedTopic_).length;
  var pendingTopics = Math.max(totalTopics - completedTopics, 0);
  var pendingCriticalTopics = topics.filter(function(topic) {
    return !isCompletedTopic_(topic) && isHighPriority_(topic.priority);
  }).length;
  var revisionCount = sumBy_(topics, function(topic) {
    return safeNumber_(topic.revisionCount);
  });
  var averageConfidence = totalTopics ? Math.round(sumBy_(topics, function(topic) {
    return safeNumber_(topic.confidence);
  }) / totalTopics) : 0;
  var mockAverage = getAverageMockPct_(mocks);
  var requiredExternal = Math.max(0, safeNumber_(subject.targetTotal) - safeNumber_(subject.internalScored));
  var safeRange = deriveSafeRange_(subject, settings, requiredExternal);
  var readiness = computeReadiness_(subject, topics, mocks, settings);
  var daysToExam = daysUntil_(subject.examDate);
  var overdueTasks = tasks.filter(function(task) {
    return !isCompletedTask_(task) && task.date && task.date < getTodayKey_();
  }).length;
  var riskLevel = computeRiskLevel_(
    requiredExternal,
    safeNumber_(subject.externalTotal),
    readiness,
    pendingCriticalTopics,
    mockAverage,
    daysToExam
  );
  var status = computeSubjectStatus_(subject, readiness, pendingCriticalTopics, overdueTasks, daysToExam);
  var priority = computeEffectivePriority_(subject.priority, daysToExam, pendingCriticalTopics, weakTopics.length);

  return Object.assign({}, subject, {
    completionPct: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
    totalTopics: totalTopics,
    completedTopics: completedTopics,
    pendingTopics: pendingTopics,
    pendingCriticalTopics: pendingCriticalTopics,
    revisionCount: revisionCount,
    averageConfidence: averageConfidence,
    requiredExternal: requiredExternal,
    safeExternalMin: safeRange.min,
    safeExternalMax: safeRange.max,
    safeExternalRangeLabel: safeRange.min + ' - ' + safeRange.max,
    daysToExam: daysToExam,
    readiness: readiness,
    riskLevel: riskLevel,
    status: status,
    priority: priority,
    weakTopicCount: weakTopics.length,
    overdueTaskCount: overdueTasks,
    averageMockPct: mockAverage
  });
}

function updateSubject_(ss, payload) {
  var subjectId = requireId_(payload.subjectId, 'subjectId');
  var patch = payload.patch || {};
  var current = getRecordById_(ss, 'Subjects', subjectId);

  if (!current) {
    throw new Error('Subject not found: ' + subjectId);
  }

  var allowed = [
    'name',
    'code',
    'examDate',
    'internalScored',
    'internalTotal',
    'externalTotal',
    'targetTotal',
    'safeExternalMin',
    'safeExternalMax',
    'priority',
    'status',
    'riskLevel',
    'focus'
  ];
  var nextRecord = Object.assign({}, current);

  allowed.forEach(function(key) {
    if (patch[key] !== undefined) {
      nextRecord[key] = patch[key];
    }
  });

  nextRecord.weightageLabel = safeNumber_(nextRecord.internalTotal) + ' / ' + safeNumber_(nextRecord.externalTotal);
  nextRecord.updatedAt = nowIso_();
  upsertRecordByKey_(ss, 'Subjects', 'id', nextRecord);

  return {
    action: 'updateSubject',
    subject: nextRecord
  };
}

function updateTopic_(ss, payload) {
  var topicId = requireId_(payload.topicId, 'topicId');
  var patch = payload.patch || {};
  var current = getRecordById_(ss, 'Topics', topicId);

  if (!current) {
    throw new Error('Topic not found: ' + topicId);
  }

  var allowed = [
    'status',
    'priority',
    'difficulty',
    'confidence',
    'revisionCount',
    'expectedMarks',
    'notes',
    'lastRevisedDate',
    'assignedDate',
    'completedDate',
    'lastStudiedDate',
    'isWeak',
    'pyqCount'
  ];
  var nextRecord = Object.assign({}, current);

  allowed.forEach(function(key) {
    if (patch[key] !== undefined) {
      nextRecord[key] = patch[key];
    }
  });

  if (patch.status === 'done' || patch.status === 'mastered') {
    nextRecord.completedDate = patch.completedDate || getTodayKey_();
  }
  if (patch.status === 'todo' && patch.completedDate === null) {
    nextRecord.completedDate = '';
  }

  nextRecord.updatedAt = nowIso_();
  upsertRecordByKey_(ss, 'Topics', 'id', nextRecord);

  if (payload.weakTopic) {
    upsertWeakTopic_(ss, {
      topicId: topicId,
      subjectId: nextRecord.subjectId,
      weakTopic: payload.weakTopic
    });
  }

  return {
    action: 'updateTopic',
    topic: nextRecord
  };
}

function createTask_(ss, payload) {
  var task = payload.task || {};
  var record = {
    id: task.id || buildId_('task'),
    date: requireId_(task.date, 'task.date'),
    subjectId: requireId_(task.subjectId, 'task.subjectId'),
    moduleId: task.moduleId || '',
    topicId: task.topicId || '',
    taskType: task.taskType || 'revision',
    title: requireId_(task.title, 'task.title'),
    plannedMinutes: safeNumber_(task.plannedMinutes),
    actualMinutes: safeNumber_(task.actualMinutes),
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    remarks: task.remarks || '',
    autoCarry: task.autoCarry !== false,
    source: task.source || 'manual',
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  };

  upsertRecordByKey_(ss, 'StudyPlan', 'id', record);

  return {
    action: 'createTask',
    task: record
  };
}

function updateTask_(ss, payload) {
  var taskId = requireId_(payload.taskId, 'taskId');
  var patch = payload.patch || {};
  var current = getRecordById_(ss, 'StudyPlan', taskId);

  if (!current) {
    throw new Error('Task not found: ' + taskId);
  }

  var nextRecord = Object.assign({}, current);
  var allowed = [
    'date',
    'subjectId',
    'moduleId',
    'topicId',
    'taskType',
    'title',
    'plannedMinutes',
    'actualMinutes',
    'priority',
    'status',
    'remarks',
    'autoCarry',
    'source'
  ];

  allowed.forEach(function(key) {
    if (patch[key] !== undefined) {
      nextRecord[key] = patch[key];
    }
  });

  if (payload.moveToTomorrow) {
    nextRecord.date = shiftDateKey_(nextRecord.date || getTodayKey_(), 1);
    nextRecord.status = 'pending';
  }
  if (payload.quickComplete) {
    nextRecord.status = 'completed';
    if (!safeNumber_(nextRecord.actualMinutes) && safeNumber_(nextRecord.plannedMinutes)) {
      nextRecord.actualMinutes = safeNumber_(nextRecord.plannedMinutes);
    }
  }
  if (payload.skipTask) {
    nextRecord.status = 'skipped';
  }

  nextRecord.updatedAt = nowIso_();
  upsertRecordByKey_(ss, 'StudyPlan', 'id', nextRecord);

  return {
    action: 'updateTask',
    task: nextRecord
  };
}

function logSession_(ss, payload) {
  var session = payload.session || {};
  var record = {
    id: session.id || buildId_('session'),
    date: session.date || getTodayKey_(),
    subjectId: requireId_(session.subjectId, 'session.subjectId'),
    moduleId: session.moduleId || '',
    topicId: session.topicId || '',
    taskId: session.taskId || '',
    minutes: Math.max(0, safeNumber_(session.minutes)),
    sessionType: session.sessionType || 'revision',
    productivityScore: safeNumber_(session.productivityScore),
    note: session.note || '',
    createdAt: nowIso_()
  };

  upsertRecordByKey_(ss, 'StudySessions', 'id', record);

  if (record.topicId) {
    var topic = getRecordById_(ss, 'Topics', record.topicId);
    if (topic) {
      topic.lastStudiedDate = record.date;
      topic.updatedAt = nowIso_();
      upsertRecordByKey_(ss, 'Topics', 'id', topic);
    }
  }

  if (record.taskId) {
    var task = getRecordById_(ss, 'StudyPlan', record.taskId);
    if (task) {
      task.actualMinutes = safeNumber_(task.actualMinutes) + record.minutes;
      if (safeNumber_(task.actualMinutes) >= Math.max(1, safeNumber_(task.plannedMinutes))) {
        task.status = 'completed';
      } else if (task.status !== 'completed') {
        task.status = 'partial';
      }
      task.updatedAt = nowIso_();
      upsertRecordByKey_(ss, 'StudyPlan', 'id', task);
    }
  }

  return {
    action: 'logSession',
    session: record
  };
}

function addMock_(ss, payload) {
  var mock = payload.mock || {};
  var record = {
    id: mock.id || buildId_('mock'),
    subjectId: requireId_(mock.subjectId, 'mock.subjectId'),
    date: mock.date || getTodayKey_(),
    score: safeNumber_(mock.score),
    total: Math.max(1, safeNumber_(mock.total, 1)),
    timeTakenMinutes: safeNumber_(mock.timeTakenMinutes),
    mistakes: stringifyList_(mock.mistakes),
    weakAreas: stringifyList_(mock.weakAreas),
    notes: mock.notes || '',
    linkedTopicIds: stringifyList_(mock.linkedTopicIds),
    followUpTaskIds: '',
    createdAt: nowIso_()
  };

  var followUpIds = [];
  var poorThreshold = safeNumber_(getSetting_(ss, 'poorMockThreshold', getExamCommandCenterSeed_().settings.poorMockThreshold), 0.55);
  var scorePct = record.score / record.total;

  if (mock.autoCreateFollowUps !== false && (scorePct < poorThreshold || record.linkedTopicIds)) {
    followUpIds = createFollowUpTasksForMock_(ss, record, mock.followUpTopicIds || splitList_(record.linkedTopicIds));
  }

  record.followUpTaskIds = followUpIds.join(',');
  upsertRecordByKey_(ss, 'Mocks', 'id', record);

  return {
    action: 'addMock',
    mock: record,
    followUpTaskIds: followUpIds
  };
}

function updateRevision_(ss, payload) {
  var revision = payload.revision || {};
  var topicId = requireId_(revision.topicId, 'revision.topicId');
  var topic = getRecordById_(ss, 'Topics', topicId);

  if (!topic) {
    throw new Error('Topic not found: ' + topicId);
  }

  var record = {
    id: revision.id || buildId_('rev'),
    subjectId: revision.subjectId || topic.subjectId,
    topicId: topicId,
    revisionStage: revision.revisionStage || 'revision_1',
    date: revision.date || getTodayKey_(),
    confidenceAfter: safeNumber_(revision.confidenceAfter),
    note: revision.note || '',
    createdAt: nowIso_()
  };

  upsertRecordByKey_(ss, 'RevisionLog', 'id', record);

  topic.revisionCount = Math.max(safeNumber_(topic.revisionCount), revisionStageRank_(record.revisionStage));
  topic.lastRevisedDate = record.date;
  topic.confidence = record.confidenceAfter || topic.confidence;
  topic.status = mapRevisionStageToTopicStatus_(record.revisionStage);
  topic.updatedAt = nowIso_();
  upsertRecordByKey_(ss, 'Topics', 'id', topic);

  var weakTopic = getWeakTopicByTopicId_(ss, topicId);
  if (weakTopic) {
    weakTopic.lastReviewedDate = record.date;
    weakTopic.updatedAt = nowIso_();
    upsertRecordByKey_(ss, 'WeakTopics', 'id', weakTopic);
  }

  return {
    action: 'updateRevision',
    revision: record
  };
}

function updateSettings_(ss, payload) {
  var patch = payload.settings || {};
  var keys = Object.keys(patch);
  var i;

  for (i = 0; i < keys.length; i += 1) {
    upsertSetting_(ss, keys[i], patch[keys[i]]);
  }

  return {
    action: 'updateSettings',
    settings: settingsSheetToObject_(readSheetRecords_(ss, 'Settings'))
  };
}

function upsertWeakTopic_(ss, payload) {
  var data = payload.weakTopic || payload;
  var topicId = requireId_(payload.topicId || data.topicId, 'topicId');
  var existing = getWeakTopicByTopicId_(ss, topicId);
  var record = existing || {
    id: buildId_('weak'),
    topicId: topicId,
    subjectId: payload.subjectId || data.subjectId || '',
    createdAt: nowIso_()
  };

  record.subjectId = payload.subjectId || data.subjectId || record.subjectId || '';
  record.severity = data.severity || record.severity || 'moderate';
  record.reason = data.reason || record.reason || '';
  record.lastReviewedDate = data.lastReviewedDate !== undefined ? data.lastReviewedDate : (record.lastReviewedDate || '');
  record.recoveryStatus = data.recoveryStatus || record.recoveryStatus || 'watch';
  record.updatedAt = nowIso_();

  upsertRecordByKey_(ss, 'WeakTopics', 'id', record);

  return {
    action: 'upsertWeakTopic',
    weakTopic: record
  };
}

function ensureSchema_(ss) {
  var definitions = getSheetDefinitions_();
  var sheetNames = Object.keys(definitions);
  var i;

  for (i = 0; i < sheetNames.length; i += 1) {
    ensureSheetWithHeaders_(ss, sheetNames[i], definitions[sheetNames[i]]);
  }
}

function seedMissingTrackerData_(ss) {
  var seed = getExamCommandCenterSeed_();
  var subjectsSheet = readSheetRecords_(ss, 'Subjects');
  var modulesSheet = readSheetRecords_(ss, 'Modules');
  var topicsSheet = readSheetRecords_(ss, 'Topics');
  var planSheet = readSheetRecords_(ss, 'StudyPlan');
  var settingsSheet = readSheetRecords_(ss, 'Settings');

  if (!settingsSheet.length) {
    seedSettings_(ss, seed.settings);
  }
  if (!subjectsSheet.length) {
    seedSubjects_(ss, seed.subjects, seed.scoreGoal);
  }
  if (!modulesSheet.length || !topicsSheet.length) {
    seedModulesAndTopics_(ss, seed.subjects);
  }
  if (!planSheet.length) {
    seedStudyPlan_(ss, seed.dailyPlan);
  }
}

function seedSettings_(ss, settings) {
  var keys = Object.keys(settings);
  var i;

  for (i = 0; i < keys.length; i += 1) {
    upsertSetting_(ss, keys[i], settings[keys[i]]);
  }
}

function seedSubjects_(ss, subjects, scoreGoal) {
  var scorePlanRows = readLegacyScorePlanRows_(ss);
  var scorePlanMap = {};

  scorePlanRows.forEach(function(row) {
    scorePlanMap[normalizeNameKey_(row.Subject)] = row;
  });

  subjects.forEach(function(subject) {
    var legacy = scorePlanMap[normalizeNameKey_(subject.name)] || {};
    var record = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      examDate: legacy['Exam Date'] || subject.examDate,
      internalScored: safeNumber_(legacy['Internal Score'], subject.internalScored),
      internalTotal: safeNumber_(legacy['Internal Max'], subject.internalTotal),
      externalTotal: safeNumber_(legacy['External Max'], subject.externalTotal),
      targetTotal: safeNumber_(subject.targetTotal || scoreGoal, scoreGoal),
      safeExternalMin: safeNumber_(subject.safeExternalMin),
      safeExternalMax: safeNumber_(subject.safeExternalMax),
      weightageLabel: safeNumber_(legacy['Internal Max'], subject.internalTotal) + ' / ' + safeNumber_(legacy['External Max'], subject.externalTotal),
      priority: subject.priority || 'medium',
      status: 'on_track',
      riskLevel: 'medium',
      focus: legacy.Focus || subject.focus || '',
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    };

    upsertRecordByKey_(ss, 'Subjects', 'id', record);
  });
}

function seedModulesAndTopics_(ss, subjects) {
  var trackerData = readLegacyTrackerSheetData_(ss);

  subjects.forEach(function(subject) {
    var moduleIndex;

    if (subject.topics && subject.topics.length) {
      for (moduleIndex = 0; moduleIndex < subject.topics.length; moduleIndex += 1) {
      var moduleId = subject.id + '-m' + (moduleIndex + 1);
      upsertRecordByKey_(ss, 'Modules', 'id', {
        id: moduleId,
        subjectId: subject.id,
        moduleNo: moduleIndex + 1,
        title: subject.moduleTitles[moduleIndex] || ('Module ' + (moduleIndex + 1)),
        priority: subject.priority || 'medium',
        status: 'active',
        expectedMarks: '',
        pyqCount: 0,
        notes: ''
      });
      }
    }

    if (trackerData[subject.id] && trackerData[subject.id].length) {
      trackerData[subject.id].forEach(function(row, rowIndex) {
        upsertRecordByKey_(ss, 'Topics', 'id', {
          id: subject.id + '-legacy-' + (rowIndex + 1),
          subjectId: subject.id,
          moduleId: subject.id + '-m' + safeNumber_(row.Module || row.module || 1),
          moduleNo: safeNumber_(row.Module || row.module || 1),
          name: row.Topic || row.topic || '',
          status: row.Done ? 'done' : 'todo',
          priority: inferPriorityFromTopicName_(row.Topic || ''),
          difficulty: 'medium',
          confidence: row.Done ? 7 : 0,
          revisionCount: row.Done ? 1 : 0,
          expectedMarks: '',
          notes: row.Notes || '',
          lastRevisedDate: '',
          assignedDate: '',
          completedDate: row.Done ? getTodayKey_() : '',
          lastStudiedDate: '',
          isWeak: false,
          pyqCount: 0,
          createdAt: nowIso_(),
          updatedAt: nowIso_()
        });
      });
      return;
    }

    if (subject.topics && subject.topics.length) {
      subject.topics.forEach(function(moduleTopics, moduleIndex) {
      moduleTopics.forEach(function(topicName, topicIndex) {
        upsertRecordByKey_(ss, 'Topics', 'id', {
          id: subject.id + '-m' + (moduleIndex + 1) + '-t' + (topicIndex + 1),
          subjectId: subject.id,
          moduleId: subject.id + '-m' + (moduleIndex + 1),
          moduleNo: moduleIndex + 1,
          name: topicName,
          status: 'todo',
          priority: inferPriorityFromTopicName_(topicName),
          difficulty: 'medium',
          confidence: 0,
          revisionCount: 0,
          expectedMarks: '',
          notes: '',
          lastRevisedDate: '',
          assignedDate: '',
          completedDate: '',
          lastStudiedDate: '',
          isWeak: false,
          pyqCount: 0,
          createdAt: nowIso_(),
          updatedAt: nowIso_()
        });
      });
    });
    }
  });
}

function seedStudyPlan_(ss, dailyPlan) {
  var legacyPlanRows = readLegacyPlanRows_(ss);

  if (legacyPlanRows.length) {
    legacyPlanRows.forEach(function(row, index) {
      if (row.IsStudyDay === false) {
        return;
      }

      upsertRecordByKey_(ss, 'StudyPlan', 'id', {
        id: 'legacy-task-' + (index + 1),
        date: normalizeDateValue_(row.Date),
        subjectId: inferSubjectIdFromName_(row.Subject),
        moduleId: '',
        topicId: '',
        taskType: inferTaskType_(row['Module(s) Focus']),
        title: row['Module(s) Focus'] || row.Subject || 'Study block',
        plannedMinutes: 120,
        actualMinutes: row.Done ? 120 : 0,
        priority: row.Phase === 1 ? 'medium' : (row.Phase === 2 ? 'high' : 'critical'),
        status: row.Done ? 'completed' : 'pending',
        remarks: '',
        autoCarry: true,
        source: 'legacy-plan',
        createdAt: nowIso_(),
        updatedAt: nowIso_()
      });
    });
    return;
  }

  dailyPlan.forEach(function(task, index) {
    upsertRecordByKey_(ss, 'StudyPlan', 'id', {
      id: 'seed-task-' + (index + 1),
      date: task.date,
      subjectId: task.subjectId,
      moduleId: '',
      topicId: '',
      taskType: task.taskType || 'revision',
      title: task.title,
      plannedMinutes: safeNumber_(task.plannedMinutes, 120),
      actualMinutes: 0,
      priority: task.priority || 'medium',
      status: 'pending',
      remarks: '',
      autoCarry: true,
      source: 'seed-plan',
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    });
  });
}

function readDataset_(ss) {
  var subjects = readSheetRecords_(ss, 'Subjects').map(normalizeSubjectRecord_);
  var modules = readSheetRecords_(ss, 'Modules').map(normalizeModuleRecord_);
  var topics = readSheetRecords_(ss, 'Topics').map(normalizeTopicRecord_);
  var tasks = readSheetRecords_(ss, 'StudyPlan').map(normalizeTaskRecord_);
  var sessions = readSheetRecords_(ss, 'StudySessions').map(normalizeSessionRecord_);
  var mocks = readSheetRecords_(ss, 'Mocks').map(normalizeMockRecord_);
  var revisions = readSheetRecords_(ss, 'RevisionLog').map(normalizeRevisionRecord_);
  var weakTopics = readSheetRecords_(ss, 'WeakTopics').map(normalizeWeakTopicRecord_);
  var settings = settingsSheetToObject_(readSheetRecords_(ss, 'Settings'));

  return {
    subjects: subjects,
    modules: modules,
    topics: topics,
    tasks: tasks,
    sessions: sessions,
    mocks: mocks,
    revisions: revisions,
    weakTopics: weakTopics,
    settings: settings,
    subjectMap: keyBy_(subjects, 'id'),
    moduleMap: keyBy_(modules, 'id'),
    topicMap: keyBy_(topics, 'id')
  };
}

function getLegacySheetDump_(ss) {
  var data = {};

  ss.getSheets().forEach(function(sheet) {
    data[sheet.getName()] = sheet.getDataRange().getValues();
  });

  return data;
}

function getSheetDefinitions_() {
  return {
    Subjects: ['id', 'name', 'code', 'examDate', 'internalScored', 'internalTotal', 'externalTotal', 'targetTotal', 'safeExternalMin', 'safeExternalMax', 'weightageLabel', 'priority', 'status', 'riskLevel', 'focus', 'createdAt', 'updatedAt'],
    Modules: ['id', 'subjectId', 'moduleNo', 'title', 'priority', 'status', 'expectedMarks', 'pyqCount', 'notes'],
    Topics: ['id', 'subjectId', 'moduleId', 'moduleNo', 'name', 'status', 'priority', 'difficulty', 'confidence', 'revisionCount', 'expectedMarks', 'notes', 'lastRevisedDate', 'assignedDate', 'completedDate', 'lastStudiedDate', 'isWeak', 'pyqCount', 'createdAt', 'updatedAt'],
    StudyPlan: ['id', 'date', 'subjectId', 'moduleId', 'topicId', 'taskType', 'title', 'plannedMinutes', 'actualMinutes', 'priority', 'status', 'remarks', 'autoCarry', 'source', 'createdAt', 'updatedAt'],
    StudySessions: ['id', 'date', 'subjectId', 'moduleId', 'topicId', 'taskId', 'minutes', 'sessionType', 'productivityScore', 'note', 'createdAt'],
    Mocks: ['id', 'subjectId', 'date', 'score', 'total', 'timeTakenMinutes', 'mistakes', 'weakAreas', 'notes', 'linkedTopicIds', 'followUpTaskIds', 'createdAt'],
    RevisionLog: ['id', 'subjectId', 'topicId', 'revisionStage', 'date', 'confidenceAfter', 'note', 'createdAt'],
    WeakTopics: ['id', 'subjectId', 'topicId', 'severity', 'reason', 'lastReviewedDate', 'recoveryStatus', 'createdAt', 'updatedAt'],
    Settings: ['key', 'value', 'updatedAt']
  };
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeaderRow_(sheet, headers.length);
    sheet.setFrozenRows(1);
    return;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var updates = false;
  headers.forEach(function(header, index) {
    if (currentHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
      updates = true;
    }
  });
  if (updates) {
    styleHeaderRow_(sheet, headers.length);
  }
  sheet.setFrozenRows(1);
}

function readSheetRecords_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var values = sheet.getDataRange().getValues();
  var headers = values[0];

  return values.slice(1).map(function(row, index) {
    var record = { _rowNumber: index + 2 };
    headers.forEach(function(header, columnIndex) {
      record[header] = row[columnIndex];
    });
    return record;
  }).filter(function(record) {
    return hasMeaningfulValue_(record, headers);
  });
}

function getRecordById_(ss, sheetName, id) {
  return readSheetRecords_(ss, sheetName).filter(function(record) {
    return String(record.id) === String(id);
  })[0] || null;
}

function getWeakTopicByTopicId_(ss, topicId) {
  return readSheetRecords_(ss, 'WeakTopics').filter(function(record) {
    return String(record.topicId) === String(topicId);
  })[0] || null;
}

function upsertRecordByKey_(ss, sheetName, keyName, record) {
  var definitions = getSheetDefinitions_();
  var headers = definitions[sheetName];
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  var rows = readSheetRecords_(ss, sheetName);
  var existing = rows.filter(function(row) {
    return String(row[keyName]) === String(record[keyName]);
  })[0];
  var values = headers.map(function(header) {
    return serializeSheetValue_(record[header]);
  });

  if (existing) {
    sheet.getRange(existing._rowNumber, 1, 1, headers.length).setValues([values]);
    return existing._rowNumber;
  }

  sheet.appendRow(values);
  return sheet.getLastRow();
}

function upsertSetting_(ss, key, value) {
  upsertRecordByKey_(ss, 'Settings', 'key', {
    key: key,
    value: value,
    updatedAt: nowIso_()
  });
}

function getSetting_(ss, key, fallback) {
  var settings = settingsSheetToObject_(readSheetRecords_(ss, 'Settings'));
  return settings[key] !== undefined ? settings[key] : fallback;
}

function clearSheetData_(ss, sheetName, columnsToReset) {
  var sheet = ss.getSheetByName(sheetName);
  var headers;
  var colIndex;
  var rowCount;
  var resetValues;

  if (!sheet || sheet.getLastRow() < 2) {
    return;
  }

  if (!columnsToReset || !columnsToReset.length) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    return;
  }

  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  rowCount = sheet.getLastRow() - 1;

  columnsToReset.forEach(function(columnName) {
    colIndex = headers.indexOf(columnName);
    if (colIndex === -1) {
      return;
    }

    resetValues = [];
    while (resetValues.length < rowCount) {
      if (columnName === 'status') {
        resetValues.push(['pending']);
      } else if (columnName === 'autoCarry') {
        resetValues.push([true]);
      } else if (columnName === 'revisionCount' || columnName === 'confidence' || columnName === 'actualMinutes' || columnName === 'pyqCount') {
        resetValues.push([0]);
      } else if (columnName === 'isWeak') {
        resetValues.push([false]);
      } else if (columnName === 'priority') {
        resetValues.push(['medium']);
      } else {
        resetValues.push(['']);
      }
    }

    sheet.getRange(2, colIndex + 1, rowCount, 1).setValues(resetValues);
  });
}

function readLegacyScorePlanRows_(ss) {
  var sheet = ss.getSheetByName('Score_Plan');
  return sheet ? sheetToObjects_(sheet) : [];
}

function readLegacyPlanRows_(ss) {
  var sheet = ss.getSheetByName('Daily_Plan');
  return sheet ? sheetToObjects_(sheet) : [];
}

function readLegacyTrackerSheetData_(ss) {
  var map = {};

  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (!/_Tracker$/.test(name)) {
      return;
    }
    map[inferSubjectIdFromName_(name.replace('_Tracker', ''))] = sheetToObjects_(sheet);
  });

  return map;
}

function sheetToObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var values = sheet.getDataRange().getValues();
  var headers = values[0];

  return values.slice(1).map(function(row) {
    var record = {};
    headers.forEach(function(header, index) {
      record[header] = row[index];
    });
    return record;
  }).filter(function(record) {
    return hasMeaningfulValue_(record, headers);
  });
}

function settingsSheetToObject_(rows) {
  var defaults = getExamCommandCenterSeed_().settings;
  var result = {};

  Object.keys(defaults).forEach(function(key) {
    result[key] = defaults[key];
  });

  rows.forEach(function(row) {
    result[row.key] = parseSettingValue_(row.value);
  });

  return result;
}

function normalizeSubjectRecord_(record) {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    code: String(record.code || ''),
    examDate: normalizeDateValue_(record.examDate),
    internalScored: safeNumber_(record.internalScored),
    internalTotal: safeNumber_(record.internalTotal),
    externalTotal: safeNumber_(record.externalTotal),
    targetTotal: safeNumber_(record.targetTotal, 70),
    safeExternalMin: safeNumber_(record.safeExternalMin),
    safeExternalMax: safeNumber_(record.safeExternalMax),
    weightageLabel: String(record.weightageLabel || ''),
    priority: String(record.priority || 'medium'),
    status: String(record.status || 'on_track'),
    riskLevel: String(record.riskLevel || 'medium'),
    focus: String(record.focus || ''),
    createdAt: String(record.createdAt || ''),
    updatedAt: String(record.updatedAt || '')
  };
}

function normalizeModuleRecord_(record) {
  return {
    id: String(record.id || ''),
    subjectId: String(record.subjectId || ''),
    moduleNo: safeNumber_(record.moduleNo),
    title: String(record.title || ''),
    priority: String(record.priority || 'medium'),
    status: String(record.status || 'active'),
    expectedMarks: String(record.expectedMarks || ''),
    pyqCount: safeNumber_(record.pyqCount),
    notes: String(record.notes || '')
  };
}

function normalizeTopicRecord_(record) {
  return {
    id: String(record.id || ''),
    subjectId: String(record.subjectId || ''),
    moduleId: String(record.moduleId || ''),
    moduleNo: safeNumber_(record.moduleNo),
    name: String(record.name || ''),
    status: String(record.status || 'todo'),
    priority: String(record.priority || 'medium'),
    difficulty: String(record.difficulty || 'medium'),
    confidence: safeNumber_(record.confidence),
    revisionCount: safeNumber_(record.revisionCount),
    expectedMarks: String(record.expectedMarks || ''),
    notes: String(record.notes || ''),
    lastRevisedDate: normalizeDateValue_(record.lastRevisedDate),
    assignedDate: normalizeDateValue_(record.assignedDate),
    completedDate: normalizeDateValue_(record.completedDate),
    lastStudiedDate: normalizeDateValue_(record.lastStudiedDate),
    isWeak: toBoolean_(record.isWeak),
    pyqCount: safeNumber_(record.pyqCount),
    createdAt: String(record.createdAt || ''),
    updatedAt: String(record.updatedAt || '')
  };
}

function normalizeTaskRecord_(record) {
  return {
    id: String(record.id || ''),
    date: normalizeDateValue_(record.date),
    subjectId: String(record.subjectId || ''),
    moduleId: String(record.moduleId || ''),
    topicId: String(record.topicId || ''),
    taskType: String(record.taskType || 'revision'),
    title: String(record.title || ''),
    plannedMinutes: safeNumber_(record.plannedMinutes),
    actualMinutes: safeNumber_(record.actualMinutes),
    priority: String(record.priority || 'medium'),
    status: String(record.status || 'pending'),
    remarks: String(record.remarks || ''),
    autoCarry: record.autoCarry === '' ? true : toBoolean_(record.autoCarry),
    source: String(record.source || ''),
    createdAt: String(record.createdAt || ''),
    updatedAt: String(record.updatedAt || '')
  };
}

function normalizeSessionRecord_(record) {
  return {
    id: String(record.id || ''),
    date: normalizeDateValue_(record.date),
    subjectId: String(record.subjectId || ''),
    moduleId: String(record.moduleId || ''),
    topicId: String(record.topicId || ''),
    taskId: String(record.taskId || ''),
    minutes: safeNumber_(record.minutes),
    sessionType: String(record.sessionType || 'revision'),
    productivityScore: safeNumber_(record.productivityScore),
    note: String(record.note || ''),
    createdAt: String(record.createdAt || '')
  };
}

function normalizeMockRecord_(record) {
  return {
    id: String(record.id || ''),
    subjectId: String(record.subjectId || ''),
    date: normalizeDateValue_(record.date),
    score: safeNumber_(record.score),
    total: Math.max(1, safeNumber_(record.total, 1)),
    timeTakenMinutes: safeNumber_(record.timeTakenMinutes),
    mistakes: String(record.mistakes || ''),
    weakAreas: String(record.weakAreas || ''),
    notes: String(record.notes || ''),
    linkedTopicIds: String(record.linkedTopicIds || ''),
    followUpTaskIds: String(record.followUpTaskIds || ''),
    createdAt: String(record.createdAt || '')
  };
}

function normalizeRevisionRecord_(record) {
  return {
    id: String(record.id || ''),
    subjectId: String(record.subjectId || ''),
    topicId: String(record.topicId || ''),
    revisionStage: String(record.revisionStage || 'revision_1'),
    date: normalizeDateValue_(record.date),
    confidenceAfter: safeNumber_(record.confidenceAfter),
    note: String(record.note || ''),
    createdAt: String(record.createdAt || '')
  };
}

function normalizeWeakTopicRecord_(record) {
  return {
    id: String(record.id || ''),
    subjectId: String(record.subjectId || ''),
    topicId: String(record.topicId || ''),
    severity: String(record.severity || 'moderate'),
    reason: String(record.reason || ''),
    lastReviewedDate: normalizeDateValue_(record.lastReviewedDate),
    recoveryStatus: String(record.recoveryStatus || 'watch'),
    createdAt: String(record.createdAt || ''),
    updatedAt: String(record.updatedAt || '')
  };
}

function computeReadiness_(subject, topics, mocks, settings) {
  var completionScore = topics.length ? (topics.filter(isCompletedTopic_).length / topics.length) * 45 : 0;
  var revisionScore = topics.length ? (sumBy_(topics, function(topic) {
    return Math.min(3, safeNumber_(topic.revisionCount));
  }) / (topics.length * 3)) * 20 : 0;
  var confidenceScore = topics.length ? (sumBy_(topics, function(topic) {
    return clamp_(safeNumber_(topic.confidence), 0, 10);
  }) / (topics.length * 10)) * 15 : 0;
  var mockScore = getAverageMockPct_(mocks) * 20;
  var penalty = 0;
  var daysToExam = daysUntil_(subject.examDate);
  var pendingCritical = topics.filter(function(topic) {
    return !isCompletedTopic_(topic) && isHighPriority_(topic.priority);
  }).length;

  if (daysToExam <= safeNumber_(settings.examSoonDays, 5) && completionScore < 25) {
    penalty += 8;
  }
  if (pendingCritical > safeNumber_(settings.criticalPendingLimit, 6)) {
    penalty += 12;
  }

  return clamp_(Math.round(completionScore + revisionScore + confidenceScore + mockScore - penalty), 0, 100);
}

function computeRiskLevel_(requiredExternal, externalTotal, readiness, pendingCritical, mockAverage, daysToExam) {
  var ratio = externalTotal > 0 ? requiredExternal / externalTotal : 1;

  if (readiness < 35 || ratio > 0.85 || (daysToExam <= 3 && pendingCritical >= 5)) {
    return 'severe';
  }
  if (readiness < 50 || ratio > 0.7 || mockAverage < 0.45 || pendingCritical >= 3) {
    return 'high';
  }
  if (readiness < 70 || ratio > 0.55) {
    return 'medium';
  }
  return 'low';
}

function computeSubjectStatus_(subject, readiness, pendingCritical, overdueTasks, daysToExam) {
  if (daysToExam < 0) {
    return 'completed';
  }
  if (readiness >= 85 && pendingCritical === 0 && overdueTasks === 0) {
    return 'completed';
  }
  if (readiness < 50 || overdueTasks > 0 || (daysToExam <= 5 && pendingCritical >= 3)) {
    return 'behind';
  }
  return 'on_track';
}

function computeEffectivePriority_(basePriority, daysToExam, pendingCritical, weakTopicCount) {
  var score = priorityRank_(basePriority);

  if (daysToExam <= 5) {
    score += 1;
  }
  if (daysToExam <= 2) {
    score += 1;
  }
  if (pendingCritical >= 4) {
    score += 1;
  }
  if (weakTopicCount >= 3) {
    score += 1;
  }

  return priorityFromRank_(score);
}

function deriveSafeRange_(subject, settings, requiredExternal) {
  var minValue = safeNumber_(subject.safeExternalMin);
  var maxValue = safeNumber_(subject.safeExternalMax);

  if (!minValue) {
    minValue = clamp_(requiredExternal + safeNumber_(settings.safeBufferMin, 3), 0, safeNumber_(subject.externalTotal));
  }
  if (!maxValue) {
    maxValue = clamp_(requiredExternal + safeNumber_(settings.safeBufferMax, 8), minValue, safeNumber_(subject.externalTotal));
  }

  return { min: minValue, max: maxValue };
}

function createFollowUpTasksForMock_(ss, mockRecord, topicIds) {
  var cleanIds = topicIds.filter(function(item) {
    return String(item || '').trim() !== '';
  });
  var followUpDate = shiftDateKey_(mockRecord.date || getTodayKey_(), 1);
  var ids = [];

  cleanIds.forEach(function(topicId) {
    var topic = getRecordById_(ss, 'Topics', topicId);
    var taskId = buildId_('task');
    var title;

    if (!topic) {
      return;
    }

    title = 'Mock follow-up: ' + topic.name;
    ids.push(taskId);
    upsertRecordByKey_(ss, 'StudyPlan', 'id', {
      id: taskId,
      date: followUpDate,
      subjectId: topic.subjectId,
      moduleId: topic.moduleId,
      topicId: topic.id,
      taskType: 'revision',
      title: title,
      plannedMinutes: 45,
      actualMinutes: 0,
      priority: 'critical',
      status: 'pending',
      remarks: 'Created from mock performance',
      autoCarry: true,
      source: 'mock-follow-up',
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    });
  });

  return ids;
}

function decorateTask_(task, subjectMap, topicMap, moduleMap) {
  return Object.assign({}, task, {
    subjectName: subjectMap[task.subjectId] ? subjectMap[task.subjectId].name : '',
    topicName: topicMap[task.topicId] ? topicMap[task.topicId].name : '',
    moduleTitle: moduleMap[task.moduleId] ? moduleMap[task.moduleId].title : '',
    overdue: !isCompletedTask_(task) && task.date && task.date < getTodayKey_()
  });
}

function decorateSession_(session, subjectMap, topicMap) {
  return Object.assign({}, session, {
    subjectName: subjectMap[session.subjectId] ? subjectMap[session.subjectId].name : '',
    topicName: topicMap[session.topicId] ? topicMap[session.topicId].name : ''
  });
}

function decorateWeakTopic_(weakTopic, subjectMap, topicMap) {
  return Object.assign({}, weakTopic, {
    subjectName: subjectMap[weakTopic.subjectId] ? subjectMap[weakTopic.subjectId].name : '',
    topicName: topicMap[weakTopic.topicId] ? topicMap[weakTopic.topicId].name : ''
  });
}

function isCompletedTask_(task) {
  return task.status === 'completed';
}

function isCompletedTopic_(topic) {
  return ['done', 'revise_1', 'revise_2', 'mastered'].indexOf(topic.status) !== -1;
}

function isHighPriority_(priority) {
  return priority === 'critical' || priority === 'high';
}

function getAverageMockPct_(mocks) {
  if (!mocks.length) {
    return 0;
  }

  return sumBy_(mocks, function(mock) {
    return safeNumber_(mock.score) / Math.max(1, safeNumber_(mock.total, 1));
  }) / mocks.length;
}

function inferPriorityFromTopicName_(topicName) {
  var text = String(topicName || '').toLowerCase();
  if (/dijkstra|floyd|a\*|minimax|deadlock|paging|sql|normalization|hash|bloom|elasticity|gst/.test(text)) {
    return 'high';
  }
  return 'medium';
}

function inferTaskType_(text) {
  var normalized = String(text || '').toLowerCase();
  if (normalized.indexOf('mock') !== -1) {
    return 'mock';
  }
  if (normalized.indexOf('pyq') !== -1) {
    return 'pyq';
  }
  if (normalized.indexOf('write') !== -1 || normalized.indexOf('answer') !== -1) {
    return 'writing';
  }
  if (normalized.indexOf('solve') !== -1 || normalized.indexOf('numerical') !== -1) {
    return 'solving';
  }
  return 'revision';
}

function inferSubjectIdFromName_(name) {
  var key = normalizeNameKey_(name);
  if (key.indexOf('math') !== -1) return 'maths';
  if (key.indexOf('ai') !== -1) return 'ai';
  if (key.indexOf('os') !== -1 || key.indexOf('operating') !== -1) return 'os';
  if (key.indexOf('dbms') !== -1) return 'dbms';
  if (key.indexOf('adsa') !== -1 || key.indexOf('advanced') !== -1) return 'adsa';
  if (key.indexOf('econom') !== -1) return 'economics';
  return key;
}

function severityRank_(severity) {
  return { mild: 1, moderate: 2, severe: 3 }[severity] || 0;
}

function revisionStageRank_(stage) {
  return { study: 0, revision_1: 1, revision_2: 2, final: 3 }[stage] || 0;
}

function mapRevisionStageToTopicStatus_(stage) {
  if (stage === 'final') return 'mastered';
  if (stage === 'revision_2') return 'revise_2';
  if (stage === 'revision_1') return 'revise_1';
  return 'done';
}

function dangerScore_(subject) {
  return safeNumber_(subject.pendingCriticalTopics) * 8
    + safeNumber_(subject.overdueTaskCount) * 6
    + (100 - safeNumber_(subject.readiness))
    + severityRank_(subject.riskLevel) * 10;
}

function scoringScore_(subject) {
  return safeNumber_(subject.readiness)
    + (100 - safeNumber_(subject.requiredExternal))
    + Math.round((1 - safeNumber_(subject.averageMockPct)) * -20);
}

function priorityRank_(priority) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[priority] || 2;
}

function priorityFromRank_(rank) {
  if (rank >= 4) return 'critical';
  if (rank === 3) return 'high';
  if (rank <= 1) return 'low';
  return 'medium';
}

function buildId_(prefix) {
  return prefix + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Request body is required.');
  }

  return JSON.parse(e.postData.contents);
}

function getActionParam_(e) {
  return getParam_(e, 'action');
}

function getParam_(e, key) {
  if (!e || !e.parameter) {
    return '';
  }
  return String(e.parameter[key] || '').trim();
}

function requireId_(value, name) {
  var text = String(value || '').trim();
  if (!text) {
    throw new Error(name + ' is required.');
  }
  return text;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function styleHeaderRow_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#dff6ff')
    .setFontColor('#12344d');
}

function hasMeaningfulValue_(record, headers) {
  return headers.some(function(header) {
    return String(record[header] || '').trim() !== '';
  });
}

function safeNumber_(value, fallback) {
  var number = Number(value);
  return isNaN(number) ? (fallback !== undefined ? fallback : 0) : number;
}

function clamp_(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function averageRounded_(rows, key) {
  if (!rows.length) {
    return 0;
  }
  return Math.round(sumBy_(rows, function(row) {
    return safeNumber_(row[key]);
  }) / rows.length);
}

function sumBy_(rows, getter) {
  return rows.reduce(function(total, row) {
    return total + safeNumber_(getter(row));
  }, 0);
}

function keyBy_(rows, key) {
  var result = {};
  rows.forEach(function(row) {
    result[row[key]] = row;
  });
  return result;
}

function normalizeDateValue_(value) {
  if (!value) {
    return '';
  }
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, getScriptTimezone_(), 'yyyy-MM-dd');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return String(value);
  }
  var date = new Date(value);
  return isNaN(date.getTime()) ? String(value) : Utilities.formatDate(date, getScriptTimezone_(), 'yyyy-MM-dd');
}

function nowIso_() {
  return Utilities.formatDate(new Date(), getScriptTimezone_(), "yyyy-MM-dd'T'HH:mm:ss");
}

function getTodayKey_() {
  return Utilities.formatDate(new Date(), getScriptTimezone_(), 'yyyy-MM-dd');
}

function shiftDateKey_(dateKey, offsetDays) {
  var date = new Date(dateKey + 'T00:00:00');
  date.setDate(date.getDate() + offsetDays);
  return Utilities.formatDate(date, getScriptTimezone_(), 'yyyy-MM-dd');
}

function daysUntil_(dateKey) {
  if (!dateKey) {
    return null;
  }
  var start = new Date(getTodayKey_() + 'T00:00:00');
  var end = new Date(dateKey + 'T00:00:00');
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function compareDateDesc_(a, b) {
  if (a === b) return 0;
  return a > b ? -1 : 1;
}

function compareNumberDesc_(a, b) {
  return safeNumber_(b) - safeNumber_(a);
}

function minutesToHours_(minutes) {
  return Math.round((safeNumber_(minutes) / 60) * 10) / 10;
}

function toBoolean_(value) {
  if (value === true || value === false) {
    return value;
  }
  return String(value).toLowerCase() === 'true';
}

function parseSettingValue_(value) {
  var text = String(value);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text !== '' && !isNaN(Number(text))) return Number(text);
  return value;
}

function serializeSheetValue_(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  return String(value);
}

function normalizeNameKey_(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function stringifyList_(value) {
  if (Array.isArray(value)) {
    return value.filter(function(item) { return String(item || '').trim() !== ''; }).join(', ');
  }
  return String(value || '');
}

function splitList_(value) {
  return String(value || '')
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(function(item) { return item !== ''; });
}

function getScriptTimezone_() {
  return Session.getScriptTimeZone() || DEFAULT_TIMEZONE_;
}
