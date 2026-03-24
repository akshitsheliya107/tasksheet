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
  note: "General discussion / meetings / calls",
};

// Static options for dropdowns
export const TYPE_OPTIONS = [
  "module testing",
  "helping and call",
  "valid bugs",
  "invalid/dev. reply bugs",
  "live bug",
  "internal bug",
  "redesign/revision count",
  "other",
  "qa replied",
  "internal valid bug",
  "mr review",
  "internal invalid/dev. reply bugs",
];

// export const STATUS_OPTIONS = ["Not started", "In progress", "Done", "Blocked"];
export const STATUS_OPTIONS = [
  "  Not started",
  "In progress",
  "MR",
  "Done",
  "On Hold",
  "Dev Replayed",
  "Debug and transfer",
  "Done On Beta",
  "Done On Dev",
  "Transfer To Leader",
  "not replicate",
];

export const BUG_TYPE_OPTIONS = [
  "Functionality",
  "Revision",
  "Invalid",
  "Duplicate",
  "New Future",
  "No Changes Needed",
  "Native Behavior",
  "Unable to replicate",
  "Transfer",
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

export const initialTypeOptions = [
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
  "Dev Replayed",
  "Debug and transfer",
];

export const initialBugTypeOptions = [
  "Functionality",
  "Revision",
  "Invalid",
  "Duplicate",
  "New Future",
  "No Changes Needed",
  "Native Behavior",
  "Unable to replicate",
  "Transfer",
];
