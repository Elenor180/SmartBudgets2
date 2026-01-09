
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialState, Category, Expense, Budget, Currency, Theme } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const calculateFinancialMetrics = (state: FinancialState) => {
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = state.monthlyIncome - totalExpenses;
  
  const budgetUtilization = state.budgets.map(budget => {
    const spent = state.expenses
      .filter(e => e.category === budget.category)
      .reduce((sum, e) => sum + e.amount, 0);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    return {
      category: budget.category,
      limit: budget.limit,
      spent,
      utilizationPercentage: percentage.toFixed(1) + '%'
    };
  });

  return { totalExpenses, savings, budgetUtilization };
};

export const getFinancialAdvice = async (state: FinancialState, userQuery: string) => {
  const model = "gemini-3-flash-preview";
  const { totalExpenses, savings, budgetUtilization } = calculateFinancialMetrics(state);
  
  const summary = `
    Currency: ${state.currency}
    Monthly Income: ${state.monthlyIncome}
    Total Expenses: ${totalExpenses}
    Current Savings/Surplus: ${savings}
    
    Detailed Budget Utilization:
    ${budgetUtilization.map(b => `- ${b.category}: Spent ${b.spent} of ${b.limit} (${b.utilizationPercentage} used)`).join('\n')}
    
    Recent Expenses: ${JSON.stringify(state.expenses.slice(0, 10).map(e => ({ desc: e.description, amt: e.amount, cat: e.category })))}
  `;

  const prompt = `
    You are a professional financial advisor. Based on the following detailed financial data, answer the user's query.
    
    Financial Profile:
    ${summary}
    
    User Query: ${userQuery}
    
    Guidelines:
    - Be concise, actionable, and encouraging.
    - Reference specific budget categories and their utilization percentages.
    - If savings are negative or budgets are exceeded, provide specific prioritization advice.
    - Use Markdown for clear formatting (bolding, lists, etc.).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text || "I couldn't generate advice at this moment. Please try again later.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeBankStatement = async (base64Image: string, mimeType: string) => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: "Analyze this bank statement. Extract recent transactions, estimate the monthly income, and suggest monthly budget limits for common categories like Food, Rent, Transport, etc based on the spending seen. Map categories to these exact values: Food, Rent, Transport, Entertainment, Utilities, Savings, Health, Shopping, Others.",
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expenses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                date: { type: Type.STRING, description: "ISO format date" },
              },
              required: ["description", "amount", "category", "date"],
            },
          },
          suggestedBudgets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                limit: { type: Type.NUMBER },
              },
              required: ["category", "limit"],
            },
          },
          estimatedMonthlyIncome: { type: Type.NUMBER },
        },
        required: ["expenses", "suggestedBudgets", "estimatedMonthlyIncome"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};

export const getFinancialHealthReport = async (state: FinancialState) => {
  const model = "gemini-3-flash-preview";
  const { totalExpenses, savings, budgetUtilization } = calculateFinancialMetrics(state);
  
  const dataString = `
    Currency: ${state.currency}
    Monthly Income: ${state.monthlyIncome}
    Total Expenses: ${totalExpenses}
    Savings: ${savings}
    Budget Utilization: ${JSON.stringify(budgetUtilization)}
  `;

  const prompt = `
    Analyze this user's financial health and provide a comprehensive report.
    Include:
    1. A "Financial Health Score" (0-100) based on savings rate and budget adherence.
    2. A brief analysis of their spending vs. income.
    3. 3-4 highly specific, actionable bullet points for immediate financial improvement.
    
    Data for Analysis:
    ${dataString}
    
    Tone: Friendly, professional, and data-driven. Use Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Health Report Error:", error);
    return "Unable to generate health report.";
  }
};

export const simulateEmailDispatch = async (userName: string, userEmail: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Write a short, professional, and exciting welcome email to a new user named ${userName} who just joined "SmartBudgets AI".
    The email should:
    - Confirm their account is active.
    - Mention that their financial data is securely stored locally.
    - Encourage them to try out the AI Advisor feature.
    - Use a premium, friendly tone.
    - Include a clear Subject line at the start of the output.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    console.log(`[SIMULATED EMAIL DISPATCH to ${userEmail}]`);
    console.log(response.text);
    return response.text;
  } catch (error) {
    console.error("Gemini Email Simulation Error:", error);
    return "Welcome to SmartBudgets AI! We're glad to have you.";
  }
};
