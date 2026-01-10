import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { FinancialState, Category, Currency, SMTPConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// BREVO CONFIGURATION
const BREVO_API_KEY = "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";
const BREVO_TRANSACTIONAL_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_CAMPAIGN_URL = "https://api.brevo.com/v3/emailCampaigns";

export const alarsTools: FunctionDeclaration[] = [
  {
    name: "update_monthly_income",
    description: "Modify the user's total monthly income. Consolidates all sources into one Primary Yield.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "The new total monthly income amount." }
      },
      required: ["amount"]
    }
  },
  {
    name: "add_income_source",
    description: "Add a specific income stream (e.g., Freelance, Salary).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Label for this income stream." },
        amount: { type: Type.NUMBER, description: "Monthly amount." }
      },
      required: ["name", "amount"]
    }
  },
  {
    name: "delete_income_source",
    description: "Remove an existing income stream.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Exact name of the income stream." }
      },
      required: ["name"]
    }
  },
  {
    name: "update_budget_limit",
    description: "Adjust the monthly spending limit for a specific category.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: Object.values(Category), description: "Category to adjust." },
        limit: { type: Type.NUMBER, description: "New monthly limit." }
      },
      required: ["category", "limit"]
    }
  },
  {
    name: "create_financial_goal",
    description: "Initialize a new financial objective.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the goal." },
        targetAmount: { type: Type.NUMBER, description: "Total amount to save." },
        category: { type: Type.STRING, enum: Object.values(Category), description: "Goal classification." }
      },
      required: ["name", "targetAmount", "category"]
    }
  }
];

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  destination: string;
  content: string;
  status: 'DELIVERED' | 'FAILED' | 'SENT';
  hash: string;
  smtpHeader?: string;
}

/**
 * TRANSLATED FROM PYTHON: Create and Send Email Campaign
 * Replicates the behavior of sib_api_v3_sdk.EmailCampaignsApi().create_email_campaign
 */
export const dispatchEmailCampaign = async (params: {
  name: string,
  subject: string,
  senderName: string,
  senderEmail: string,
  htmlContent: string,
  listIds: number[],
  scheduledAt?: string
}): Promise<any> => {
  try {
    const response = await fetch(BREVO_CAMPAIGN_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: params.name,
        subject: params.subject,
        sender: { name: params.senderName, email: params.senderEmail },
        type: "classic",
        htmlContent: params.htmlContent,
        recipients: { listIds: params.listIds },
        scheduledAt: params.scheduledAt || new Date(Date.now() + 5000).toISOString() // Schedule slightly in future
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Campaign dispatch rejected.");
    return data;
  } catch (error) {
    console.error("[CAMPAIGN_FAILURE]", error);
    throw error;
  }
};

/**
 * BREVO TRANSACTIONAL DISPATCH
 * Relays individual security telemetry
 */
export const dispatchSecurityAuditEmail = async (action: string, metadata: any, smtpConfig?: SMTPConfig): Promise<AuditLogEntry> => {
  // Verified Sender
  const senderEmail = "costarandy380@gmail.com";
  // Always the receiver per user request
  const receiverEmail = "randy234coster@gmail.com";
  
  const timestamp = new Date().toISOString();
  const messageId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const integrityHash = btoa(timestamp + action).substr(0, 16).toUpperCase();

  const emailBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
      <h2 style="color: #e11d48; margin-bottom: 20px;">QR Intelligence Security Audit</h2>
      <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;"><strong>Action:</strong> ${action}</p>
        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
        <p style="margin: 5px 0;"><strong>Environment:</strong> Production Neural Node</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace;">
          <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${JSON.stringify(metadata, null, 2)}</pre>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p style="font-size: 10px; color: #64748b; margin: 0;">Integrity Hash: ${integrityHash}</p>
        <p style="font-size: 10px; color: #64748b; margin: 5px 0 0 0;">Transaction ID: ${messageId}</p>
      </div>
    </div>
  `;

  try {
    const brevoResponse = await fetch(BREVO_TRANSACTIONAL_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "Smart Budgets Audit", email: senderEmail },
        to: [{ email: receiverEmail, name: "System Owner" }],
        subject: `[SECURITY AUDIT] ${action} - ID: ${messageId}`,
        htmlContent: emailBody
      })
    });

    const isDelivered = brevoResponse.ok;
    const responseData = await brevoResponse.json().catch(() => ({}));

    const entry: AuditLogEntry = {
      id: messageId,
      timestamp,
      action,
      destination: receiverEmail,
      content: `Relay Status: ${brevoResponse.status} ${brevoResponse.statusText}\n${JSON.stringify(responseData, null, 2)}`,
      status: isDelivered ? 'DELIVERED' : 'FAILED',
      hash: integrityHash,
      smtpHeader: `POST /v3/smtp/email`
    };

    const existing = JSON.parse(localStorage.getItem('sb_security_audit_trail') || '[]');
    localStorage.setItem('sb_security_audit_trail', JSON.stringify([entry, ...existing].slice(0, 50)));

    return entry;
  } catch (error) {
    console.error("[AUDIT_RELAY_FAILURE]", error);
    const failedEntry: AuditLogEntry = {
      id: messageId,
      timestamp,
      action,
      destination: receiverEmail,
      content: `Network failure during Brevo dispatch: ${error instanceof Error ? error.message : 'Unknown'}`,
      status: 'FAILED',
      hash: integrityHash
    };
    const existing = JSON.parse(localStorage.getItem('sb_security_audit_trail') || '[]');
    localStorage.setItem('sb_security_audit_trail', JSON.stringify([failedEntry, ...existing].slice(0, 50)));
    return failedEntry;
  }
};

export const getALARSResponse = async (state: FinancialState, history: { role: string; parts: { text: string }[] }[]) => {
  const model = "gemini-3-pro-preview";
  const systemInstruction = `
    You are ALARS, the central autonomous intelligence for Smart Budgets.
    AUTONOMY STATUS: ${state.alarsAutonomy ? 'ENABLED' : 'DISABLED'}.
    Manage user workspace parameters: Income, Budgets, Goals, Reminders.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: history,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: alarsTools }],
        temperature: 0.1,
      },
    });
    return response;
  } catch (error) {
    console.error("ALARS API Error:", error);
    throw error;
  }
};

export const getFinancialAdvice = async (state: FinancialState, userQuery: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `User Query: ${userQuery}\n\nContext: ${JSON.stringify(state)}`,
    config: { systemInstruction: "Expert financial advice engine. Be concise." }
  });
  return response.text || "Advice engine error.";
};

export const analyzeBankStatement = async (base64Data: string, mimeType: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze and return JSON: {expenses, suggestedBudgets, estimatedMonthlyIncome}" },
      ],
    },
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || "{}");
};

export const getFinancialHealthReport = async (state: FinancialState) => {
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze state: ${JSON.stringify(state)}`,
    config: {
      systemInstruction: 'Financial advisor health report. Concise Markdown.',
    },
  });
  return response.text;
};

export const simulateEmailDispatch = async (name: string, email: string) => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Welcome ${name} (${email}).`,
  });
  return response.text;
};

export const simulatePasswordReset = async (email: string) => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Reset for ${email}.`,
  });
  return response.text;
};
