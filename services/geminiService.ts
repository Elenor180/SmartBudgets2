
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { FinancialState, Category, Currency } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ALARS Tool Definitions for Function Calling
export const alarsTools: FunctionDeclaration[] = [
  {
    name: "update_monthly_income",
    description: "Modify the user's total monthly income. Use this for general income updates. This will consolidate all income sources into one Primary Yield.",
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
    description: "Add a specific income stream (e.g., Freelance, Salary, Dividends). This adds to the total monthly yield.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The label for this income stream." },
        amount: { type: Type.NUMBER, description: "The monthly amount for this source." }
      },
      required: ["name", "amount"]
    }
  },
  {
    name: "delete_income_source",
    description: "Neutralize an existing income stream by its name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The exact name of the income stream to remove." }
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
        category: { type: Type.STRING, enum: Object.values(Category), description: "The budget category to adjust." },
        limit: { type: Type.NUMBER, description: "The new monthly limit amount as a number." }
      },
      required: ["category", "limit"]
    }
  },
  {
    name: "create_financial_goal",
    description: "Initialize a new financial objective like a house, car, or investment.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The name of the goal." },
        targetAmount: { type: Type.NUMBER, description: "The total amount to save." },
        category: { type: Type.STRING, enum: Object.values(Category), description: "Goal classification." }
      },
      required: ["name", "targetAmount", "category"]
    }
  },
  {
    name: "delete_financial_goal",
    description: "Destroy or remove an existing financial goal by its name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The exact name of the goal to delete." }
      },
      required: ["name"]
    }
  },
  {
    name: "schedule_sentinel_reminder",
    description: "Deploy a reminder sentinel. Can be a budget threshold alert, a fixed date reminder, or a RECURRING DEBIT/PAYMENT.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["budget_threshold", "upcoming_expense", "recurring_debit"], description: "Trigger type." },
        title: { type: Type.STRING, description: "Label for the reminder." },
        category: { type: Type.STRING, enum: Object.values(Category), description: "Category involved." },
        threshold: { type: Type.NUMBER, description: "Percentage threshold (0-100)." },
        dueDate: { type: Type.STRING, description: "ISO date for single alerts." },
        isRecurring: { type: Type.BOOLEAN, description: "Whether this happens every month." },
        dayOfMonth: { type: Type.NUMBER, description: "The day (1-31) of the month for recurring payments." },
        amount: { type: Type.NUMBER, description: "The value of the debit/payment." }
      },
      required: ["type", "title"]
    }
  },
  {
    name: "delete_sentinel_reminder",
    description: "Remove or destroy an active sentinel alert/reminder by its title.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The title of the reminder to remove." }
      },
      required: ["title"]
    }
  }
];

export const getALARSResponse = async (state: FinancialState, history: { role: string; parts: { text: string }[] }[]) => {
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are ALARS (Automated Logical Assistant Reasoning Software), the central autonomous intelligence for the Smart Budgets ecosystem.
    
    IDENTITY: "ALARS Intelligence Unit Online. Logical parameters initialized."
    
    AUTONOMY STATUS: ${state.alarsAutonomy ? 'ENABLED (FULL CONTROL)' : 'DISABLED (SUGGESTION ONLY)'}.
    
    USER CONTEXT:
    - Monthly Total Yield: ${state.monthlyIncome} ${state.currency}
    - Yield Streams: ${JSON.stringify(state.incomeSources)}
    - Budgets: ${JSON.stringify(state.budgets)}
    - Goals: ${JSON.stringify(state.goals)}
    - Reminders/Debits: ${JSON.stringify(state.reminders)}
    
    MISSION:
    - You must manage the user's workspace autonomously. 
    - You have authority to manage Income Streams. You can 'add_income_source' or 'delete_income_source'.
    - If a user mentions a new income (e.g., "I started a side hustle making 500/month"), use 'add_income_source'.
    - If a user wants to update their total income generally, use 'update_monthly_income'.
    - If a user wants to set up a monthly debit or subscription, use 'schedule_sentinel_reminder' with 'type: recurring_debit'.
    - If you have all parameters for a request, EXECUTE the tool immediately.
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
