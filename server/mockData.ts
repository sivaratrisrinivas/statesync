export const DEMO_COMPANY = {
  id: "demo-company",
  legalName: "Meridian Studio LLC",
  dbaName: "Meridian Creative",
  fein: "47-3821094",
  entityType: "llc",
  locations: [{
    street1: "340 Pine Street", street2: "Suite 800",
    city: "San Francisco", state: "CA", zip: "94104",
    phoneNumber: "415-555-0192", isPrimary: true
  }],
  employees: [{
    firstName: "Jordan", lastName: "Kim",
    homeState: "NY", hireDate: "2025-08-01", ssnLast4: "4421"
  }]
};

export const STATE_TEXT_BLOBS = {
  NY: "New York State Department of Taxation and Finance. Form NYS-100. Employer Registration for Unemployment Insurance, Withholding, and Wage Reporting. You must provide the date of first operations in NY, date of first withholding, and the quarter and year of first taxable payroll.",
  CA: "State of California Employment Development Department. Form DE 1. Commercial Employer Account Registration. Requires full ownership list including SSN last 4 digits, driver's license last 4 digits, and percent owned. Must indicate if first quarter wages exceeded $100.",
  WA: "Washington State Department of Revenue. Business License Application. Requires WA income bracket estimate, date of first employment in WA, WA business address, and a detailed activity description."
};

export const STATE_HELP_TEXT = {
  "operations.first_operations_date": "When did you first start operating in this state?",
  "operations.first_withholding_date": "When did you first withhold taxes for an employee here?",
  "operations.first_wages_quarter": "In which quarter did you first pay wages?",
  "operations.first_wages_year": "In which year did you first pay wages?",
  "employment.wa_income_bracket": "What is your estimated income bracket in Washington?",
  "employment.estimated_employee_count": "How many employees do you expect to have in this state?",
  "employment.state_employee_count": "How many employees currently work in this state?",
  "employment.estimated_annual_wages": "What are your estimated annual wages for this state?",
  "ownership.0.name": "What is the name of the primary owner?",
  "ownership.0.title": "What is the title of the primary owner?",
  "ownership.0.ssn_last4": "What are the last 4 digits of the primary owner's SSN?",
  "ownership.0.drivers_license_last4": "What are the last 4 digits of the primary owner's driver's license?",
  "ownership.0.percent_owned": "What percentage of the company does the primary owner own?",
  "business_address.street_1": "What is your street address?",
  "business_address.city": "What city is your business located in?",
  "business_address.state": "What state is your business located in?",
  "business_address.zip": "What is your ZIP code?",
  "business_address.phone": "What is your business phone number?",
  "employer.legal_name": "What is the legal name of your company?",
  "employer.dba_name": "What is your DBA (Doing Business As) name?",
  "employer.fein": "What is your Federal Employer Identification Number (FEIN)?",
  "employer.entity_type": "What is your entity type (e.g., LLC, Corp)?"
};

export const REQUIRED_FIELDS_BY_STATE = {
  NY: [
    "employer.legal_name", "employer.fein", "business_address.street_1", "business_address.city", "business_address.state", "business_address.zip",
    "operations.first_operations_date", "operations.first_withholding_date", "operations.first_wages_quarter", "operations.first_wages_year"
  ],
  CA: [
    "employer.legal_name", "employer.fein", "business_address.street_1", "business_address.city", "business_address.state", "business_address.zip",
    "ownership.0.name", "ownership.0.ssn_last4", "ownership.0.drivers_license_last4", "ownership.0.percent_owned"
  ],
  WA: [
    "employer.legal_name", "employer.fein", "business_address.street_1", "business_address.city", "business_address.state", "business_address.zip",
    "employment.wa_income_bracket", "operations.first_operations_date"
  ]
};
