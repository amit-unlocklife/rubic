// ── UnlockLife Senior Observation Rubric — Google Apps Script ──────────────
// Deploy as Web App:
//   Extensions > Apps Script > Deploy > New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
//   Copy the Web App URL and paste it into the HTML file as SCRIPT_URL.
// ──────────────────────────────────────────────────────────────────────────

var SPREADSHEET_ID = ''; // ← Paste your Google Sheet ID here (from the URL)
// If left blank, the script will create a new spreadsheet automatically.

// ── Weekly sheet column headers ───────────────────────────────────────────
var WEEKLY_HEADERS = [
  'Timestamp',
  'Senior Name',
  'Date of Observation',
  'Observed By',
  'Week Number',
  'Stage',
  // Physical
  'Physical – Participated actively',
  'Physical – Warm-up & cool-down',
  'Physical – Effort / improvement',
  'Physical – Reduced complaint',
  'Physical – Regularity',
  'Physical Total (/ 15)',
  'Physical Notes',
  // Social
  'Social – Initiated conversation',
  'Social – Responded when spoken to',
  'Social – Shared something personal',
  'Social – Interest in others',
  'Social – Group participation',
  'Social Total (/ 15)',
  'Social Notes',
  // Cognitive
  'Cognitive – Recalled previous session',
  'Cognitive – Multi-step instructions',
  'Cognitive – Curious question',
  'Cognitive – Trivia / quiz attempt',
  'Cognitive – Creative thinking',
  'Cognitive Total (/ 15)',
  'Cognitive Notes',
  // Emotional
  'Emotional – Visibly happy / relaxed',
  'Emotional – Positive emotion',
  'Emotional – Handled difficulty',
  'Emotional – Emotional openness',
  'Emotional – Left in better state',
  'Emotional Total (/ 15)',
  'Emotional Notes',
  // Totals
  'Weekly Observation Total (/ 60)'
];

// ── Monthly sheet column headers ──────────────────────────────────────────
var MONTHLY_HEADERS = [
  'Timestamp',
  'Senior Name',
  'Date of Observation',
  'Observed By',
  'Week / Month Reference',
  'Stage',
  'Physical – UnlockFitness Challenge (Complete the Challenge)',
  'Social – UnlockConnect Challenge (Group Connection Time)',
  'Cognitive – UnlockMind Challenge (Quiz or NeuroCraft Challenge)',
  'Emotional – UnlockCreate Challenge (Nostalgia Sharing Circle)',
  'Challenge Bonus Total (/ 20)'
];

// ── Entry point ───────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var type    = payload.type; // 'weekly' or 'monthly'

    var ss = getOrCreateSpreadsheet();

    if (type === 'weekly') {
      saveWeekly(ss, payload);
    } else if (type === 'monthly') {
      saveMonthly(ss, payload);
    } else {
      return respond(false, 'Unknown type: ' + type);
    }

    return respond(true, 'Saved to ' + type + ' sheet.');
  } catch (err) {
    return respond(false, err.message);
  }
}

// ── Save weekly row ───────────────────────────────────────────────────────
function saveWeekly(ss, d) {
  var sheet = getOrCreateSheet(ss, 'Weekly', WEEKLY_HEADERS);

  var s = d.scores;
  var row = [
    new Date(),
    d.seniorName,
    d.obsDate,
    d.observer,
    d.weekNo,
    d.stage,
    // Physical
    s.physical[0], s.physical[1], s.physical[2], s.physical[3], s.physical[4],
    s.physical.reduce(function(a,b){return a+b;}, 0),
    d.notes.physical,
    // Social
    s.social[0], s.social[1], s.social[2], s.social[3], s.social[4],
    s.social.reduce(function(a,b){return a+b;}, 0),
    d.notes.social,
    // Cognitive
    s.cognitive[0], s.cognitive[1], s.cognitive[2], s.cognitive[3], s.cognitive[4],
    s.cognitive.reduce(function(a,b){return a+b;}, 0),
    d.notes.cognitive,
    // Emotional
    s.emotional[0], s.emotional[1], s.emotional[2], s.emotional[3], s.emotional[4],
    s.emotional.reduce(function(a,b){return a+b;}, 0),
    d.notes.emotional,
    // Grand total
    d.weeklyTotal
  ];

  sheet.appendRow(row);
}

// ── Save monthly row ──────────────────────────────────────────────────────
function saveMonthly(ss, d) {
  var sheet = getOrCreateSheet(ss, 'Monthly', MONTHLY_HEADERS);

  var c = d.challenges;
  var row = [
    new Date(),
    d.seniorName,
    d.obsDate,
    d.observer,
    d.weekNo,
    d.stage,
    c.physical  ? 'Yes' : 'No',
    c.social    ? 'Yes' : 'No',
    c.cognitive ? 'Yes' : 'No',
    c.emotional ? 'Yes' : 'No',
    d.bonusTotal
  ];

  sheet.appendRow(row);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getOrCreateSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  // No ID set — create a new sheet and log its URL once
  var ss = SpreadsheetApp.create('UnlockLife Senior Observation Rubric');
  Logger.log('Created spreadsheet: ' + ss.getUrl());
  // Store the ID so subsequent calls reuse the same sheet
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    formatHeaderRow(sheet);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    formatHeaderRow(sheet);
  }
  return sheet;
}

function formatHeaderRow(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setFontWeight('bold');
  range.setBackground('#1D9E75');
  range.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

function respond(success, message) {
  var output = ContentService.createTextOutput(
    JSON.stringify({ success: success, message: message })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
