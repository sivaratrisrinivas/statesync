import { GoogleGenAI, Type } from "@google/genai";
import { STATE_TEXT_BLOBS } from "./mockData";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

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

export async function extractCanonicalPayload(stateTextContent: string, companyData: any, targetState: string) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY' || process.env.GEMINI_API_KEY === 'mock-key') {
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

  if (targetState === 'NY') {
    return {
      ...base,
      operations: {
        first_operations_date: "2025-08-01",
        first_withholding_date: "2025-08-01",
        first_wages_quarter: "",
        first_wages_year: ""
      }
    };
  } else if (targetState === 'CA') {
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
  } else if (targetState === 'WA') {
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
