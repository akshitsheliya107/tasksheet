export const initialEntries = [
  {
    id: 1,
    date: "12/1/2026",
    task: "internal : https://app.clickup.com/t/86d1j1d4j - done\nGlobal > Test live changes locally in the production branch, ensuring all related test case scenarios are covered.",
    hrs: 1,
    min: 6,
    type: "Internal Bug",
    status: "Done",
    bugType: "Functionality",
    isValid: null,
  },
  {
    id: 2,
    date: "",
    task: "internal : https://app.clickup.com/t/86d1hbttu - debug & transfer\nPunch List> Check on my punch list > Show data in app but not select my punch list in Panel",
    hrs: 0,
    min: 15,
    type: "",
    status: "In progress",
    bugType: "",
    isValid: null,
  },
  {
    id: 3,
    date: "",
    task: "internal : https://app.clickup.com/t/86d1hbtmv -\nST> Check on MY ST > Show data in app but not select my ST in Panel",
    hrs: 0,
    min: 5,
    type: "",
    status: "Not started",
    bugType: "",
    isValid: null,
  },
  {
    id: 4,
    date: "",
    task: "internal : https://app.clickup.com/t/86d1j4094 - Done\nGlobal > An API is encountering issues with payload values from the front-end. Problems include raw values, special characters, decoding, and sanitization. refer to the attachments for more details.",
    hrs: 2,
    min: 56,
    type: "Valid Bugs",
    status: "Done",
    bugType: "Functionality",
    isValid: null,
  },
  {
    id: 5,
    date: "",
    task: "internal : https://app.clickup.com/t/86d1h9576 -> done\nGlobal > Page title needs to show the backslashes",
    hrs: 0,
    min: 42,
    type: "",
    status: "Done",
    bugType: "",
    isValid: null,
  },
  {
    id: 6,
    date: "",
    task: "internal : https://app.clickup.com/t/86d1j91py -> in progress\nget-global-directory > On the front-end side golbaly, the backslash value is being escaped, resulting in no backslash being sent in the payload.",
    hrs: 1,
    min: 41,
    type: "",
    status: "In progress",
    bugType: "",
    isValid: null,
  },
];

export const initialDiscussion = {
  hrs: 0,
  min: 19,
  note: "Discussion / meetings / calls",
};

// ✅ ADDED "Panel Bugs" and "NF"
export const TYPE_OPTIONS = [
  "Panel Bugs",
  "Alpha Bugs",
  "NF",
  "internal bug",
  "module testing",
  "helping and call",
  "valid bugs",
  "invalid/dev. reply bugs",
  "live bug",
  "Suggestion",
  "redesign/revision count",
  "other",
  "qa replied",
  "internal valid bug",
  "mr review",
  "internal invalid/dev. reply bugs",
];

export const STATUS_OPTIONS = [
  "Not started",
  "In progress",
  "MR",
  "Done",
  "On Hold",
  "Dev Replied",
  "Debug and transfer",
  "Done On Beta",
  "Done On Dev",
  "Transfer To Leader",
  "not replicate",
  "Review",
  "Testing",
];

export const BUG_TYPE_OPTIONS = [
  "Functionality",
  "Revision",
  "Invalid",
  "Duplicate",
  "New Feature",
  "No Changes Needed",
  "Native Behavior",
  "Unable to replicate",
  "Debug & Transfer",
  "BE side pending work",
  "UI side pending work", 
];

export const initialTesting = {
  testingTime: { hrs: 1, min: 0 },
  testingModule: "Global",
  testCaseScenario: "invoice module add edit functionality",
  bugFoundedModule: "invoice",
  bugs: [
    {
      id: 1,
      description:
        'invoice > Add Invoice > Terms > When I add a special character value in the terms field, it displays an error message: "Something went wrong. Please try again later." refer attachments',
      url: "https://app.clickup.com/t/86d1khy40",
    },
    {
      id: 2,
      description:
        "invoice > items > add item to invoice > add manual item > Cost Code > The cost code field displays an encoded value when adding time, but it shows the correct value when viewing it. refer attachments",
      url: "https://app.clickup.com/t/86d1khzzb",
    },
  ],
};

// ✅ ADDED "Panel Bugs" and "NF"
export const initialTypeOptions = [
  "Panel Bugs",
  "NF",
  "Mr Review",
  "Module Testing",
  "Helping and Call",
  "Valid Bugs",
  "Invalid/Dev. Reply Bugs",
  "Live Bug",
  "Internal Bug",
  "Redesign/Revision Count",
  "Other",
  "QA Replied",
];

export const initialStatusOptions = [
  "Not started",
  "In progress",
  "MR",
  "Done",
  "On Hold",
  "Dev Replied",
  "Debug and transfer",
  "Done On Beta",
  "Done On Dev",
  "Transfer To Leader",
  "not replicate",
  "Review",
  "Testing",
];

export const initialBugTypeOptions = [
  "Functionality",
  "Revision",
  "Invalid",
  "Duplicate",
  "New Feature",
  "No Changes Needed",
  "Native Behavior",
  "Unable to replicate",
  "Debug & Transfer",
  "BE side pending work",
  "UI side pending work",
];

// ════════════════════════════════════════════════════════════
// CLICKUP INTEGRATION CONFIG
// ════════════════════════════════════════════════════════════

// Default list-to-type mapping rules
// Order matters! First match wins (priority based).
export const DEFAULT_CLICKUP_LIST_MAPPING = [
  {
    id: "rule_sprint",
    pattern: "^sprint",           // regex: list name starts with "sprint"
    matchType: "regex",
    type: "NF",
    statusSource: "panel_field",  // use "Panel" custom field for status
    bugTypeSource: "none",         // NF doesn't have bug type
    enabled: true,
  },
  {
    id: "rule_panel",
    pattern: "panel",
    matchType: "contains",
    type: "Panel Bugs",
    statusSource: "panel_field",
    bugTypeSource: "custom_field",
    enabled: true,
  },
  {
    id: "rule_alpha",
    pattern: "alpha",
    matchType: "contains",
    type: "Alpha Bugs",
    statusSource: "panel_field",
    bugTypeSource: "custom_field",
    enabled: true,
  },
  {
    id: "rule_internal_qa",
    pattern: "internal",
    matchType: "contains",
    type: "Internal Bug",
    statusSource: "main_status",
    bugTypeSource: "custom_field",
    enabled: true,
  },
  {
    id: "rule_setting",
    pattern: "setting",
    matchType: "contains",
    type: "Internal Bug",
    statusSource: "main_status",
    bugTypeSource: "custom_field",
    enabled: true,
  },
  {
    id: "rule_modulewise",
    pattern: "modulewise",
    matchType: "contains",
    type: "Internal Bug",
    statusSource: "main_status",
    bugTypeSource: "custom_field",
    enabled: true,
  },
];

// Default ClickUp config (empty - user fills in via Settings page later)
export const initialClickupConfig = {
  apiToken: "",
  teamId: "",
  userId: "",
  reportName: "",
  listMapping: DEFAULT_CLICKUP_LIST_MAPPING,
  defaultType: "Internal Bug",          // fallback if no rule matches
  defaultStatusSource: "main_status",
  defaultBugTypeSource: "custom_field",
  panelCustomFieldName: "Panel",        // ClickUp custom field name for status
  bugTypeCustomFieldName: "Bug Type",   // ClickUp custom field name for bug type
  lastSyncedAt: null,
  isConfigured: false,
};