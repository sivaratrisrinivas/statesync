import express from "express";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";

// ── Mock Data ─────────────────────────────────────────────────────────

const DEMO_COMPANY = {
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

const STATE_TEXT_BLOBS: Record<string, string> = {
    NY: "New York State Department of Taxation and Finance. Form NYS-100. Employer Registration for Unemployment Insurance, Withholding, and Wage Reporting. You must provide the date of first operations in NY, date of first withholding, and the quarter and year of first taxable payroll.",
    CA: "State of California Employment Development Department. Form DE 1. Commercial Employer Account Registration. Requires full ownership list including SSN last 4 digits, driver's license last 4 digits, and percent owned. Must indicate if first quarter wages exceeded $100.",
    WA: "Washington State Department of Revenue. Business License Application. Requires WA income bracket estimate, date of first employment in WA, WA business address, and a detailed activity description."
};

const STATE_HELP_TEXT: Record<string, string> = {
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

const REQUIRED_FIELDS_BY_STATE: Record<string, string[]> = {
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

// ── Gemini AI ─────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock-key" });

const CANONICAL_SCHEMA_JSON_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        employer: {
            type: Type.OBJECT,
            properties: {
                legal_name: { type: Type.STRING },
                dba_name: { type: Type.STRING },
                fein: { type: Type.STRING },
                entity_type: { type: Type.STRING }
            }
        },
        business_address: {
            type: Type.OBJECT,
            properties: {
                street_1: { type: Type.STRING },
                street_2: { type: Type.STRING },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                zip: { type: Type.STRING },
                phone: { type: Type.STRING }
            }
        },
        operations: {
            type: Type.OBJECT,
            properties: {
                first_operations_date: { type: Type.STRING },
                first_withholding_date: { type: Type.STRING },
                first_wages_quarter: { type: Type.STRING },
                first_wages_year: { type: Type.STRING }
            }
        },
        employment: {
            type: Type.OBJECT,
            properties: {
                estimated_employee_count: { type: Type.STRING },
                state_employee_count: { type: Type.STRING },
                estimated_annual_wages: { type: Type.STRING },
                wa_income_bracket: { type: Type.STRING }
            }
        },
        ownership: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    title: { type: Type.STRING },
                    ssn_last4: { type: Type.STRING },
                    drivers_license_last4: { type: Type.STRING },
                    percent_owned: { type: Type.STRING }
                }
            }
        }
    }
};

async function extractCanonicalPayload(stateTextContent: string, companyData: any, targetState: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "mock-key") {
        return getMockPayload(companyData, targetState);
    }

    const prompt = `
    You are an expert tax compliance assistant.
    Read the following state tax registration requirements:
    ${stateTextContent}

    Here is the company data:
    ${JSON.stringify(companyData, null, 2)}

    Extract the relevant information to fill out the canonical schema for the state of ${targetState}.
    If a field is not available in the company data, leave it empty or omit it.
    Only include fields that are relevant to the state requirements or basic company info.
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: CANONICAL_SCHEMA_JSON_SCHEMA
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Gemini API error:", error);
        return getMockPayload(companyData, targetState);
    }
}

function getMockPayload(companyData: any, targetState: string) {
    const base = {
        employer: {
            legal_name: companyData.legalName,
            dba_name: companyData.dbaName,
            fein: companyData.fein,
            entity_type: companyData.entityType
        },
        business_address: {
            street_1: companyData.locations[0].street1,
            street_2: companyData.locations[0].street2,
            city: companyData.locations[0].city,
            state: companyData.locations[0].state,
            zip: companyData.locations[0].zip,
            phone: companyData.locations[0].phoneNumber
        }
    };

    if (targetState === "NY") {
        return {
            ...base,
            operations: {
                first_operations_date: "2025-08-01",
                first_withholding_date: "2025-08-01",
                first_wages_quarter: "",
                first_wages_year: ""
            }
        };
    } else if (targetState === "CA") {
        return {
            ...base,
            ownership: [{
                name: "Jordan Kim",
                title: "Owner",
                ssn_last4: "4421",
                drivers_license_last4: "",
                percent_owned: "100"
            }]
        };
    } else if (targetState === "WA") {
        return {
            ...base,
            employment: {
                wa_income_bracket: "",
                estimated_employee_count: "1"
            },
            operations: {
                first_operations_date: "2025-08-01"
            }
        };
    }
    return base;
}

// ── Express App ───────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// In-memory sessions (ephemeral in serverless — resets on cold starts)
const sessions: Record<string, any> = {};

app.get("/api/companies/demo-company", (_req, res) => {
    res.json(DEMO_COMPANY);
});

app.get("/api/companies/demo-company/locations", (_req, res) => {
    res.json(DEMO_COMPANY.locations);
});

app.get("/api/companies/demo-company/employees", (_req, res) => {
    res.json(DEMO_COMPANY.employees);
});

app.post("/api/companies/:id/compliance-sessions", async (req, res) => {
    const { targetState } = req.body;
    const companyId = req.params.id;

    if (companyId !== "demo-company") {
        return res.status(404).json({ error: "Company not found" });
    }

    const stateText = STATE_TEXT_BLOBS[targetState];
    if (!stateText) {
        return res.status(400).json({ error: "Invalid state" });
    }

    const payload = await extractCanonicalPayload(stateText, DEMO_COMPANY, targetState);

    const sessionId = crypto.randomUUID();

    const session = {
        id: sessionId,
        companyId,
        targetState,
        canonicalPayload: payload,
        ...computeSessionState(payload, targetState)
    };

    sessions[sessionId] = session;
    res.json(session);
});

app.get("/api/compliance-sessions/:id", (req, res) => {
    const session = sessions[req.params.id];
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
});

app.put("/api/compliance-sessions/:id", (req, res) => {
    const session = sessions[req.params.id];
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { fieldPath, value } = req.body;

    const parts = fieldPath.split(".");
    let current = session.canonicalPayload;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = isNaN(Number(parts[i + 1])) ? {} : [];
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    const updatedState = computeSessionState(session.canonicalPayload, session.targetState);
    Object.assign(session, updatedState);

    res.json(session);
});

function computeSessionState(payload: any, targetState: string) {
    const requiredFields = REQUIRED_FIELDS_BY_STATE[targetState] || [];
    let score = 50;
    const missingFields: { path: string; helpText: string }[] = [];

    for (const field of requiredFields) {
        const parts = field.split(".");
        let val = payload;
        for (const part of parts) {
            if (val) val = val[part];
        }

        if (val && String(val).trim() !== "") {
            score += 1;
        } else {
            score -= 2;
            missingFields.push({
                path: field,
                helpText: STATE_HELP_TEXT[field] || `Please provide ${field}`
            });
        }
    }

    score = Math.max(0, Math.min(100, score));

    return {
        readinessScore: score,
        missingFields
    };
}

export default app;
