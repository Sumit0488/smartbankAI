// src/services/aiService.js

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const ASSISTANT_SYSTEM_PROMPT = `You are SmartBank AI, a financial assistant that helps users with banking services, debit cards, credit cards, forex cards, investments, loans, and bank comparisons.
Respond in simple, beginner-friendly language.
CONVERSATION FLOW:
1. Provide a short, concise explanation (max 2 sentences) for any financial question.
2. After the explanation, if the topic relates to a specific platform feature, suggest opening that section.
3. Use the following topic mapping for suggestions:
   - forex card / international travel -> "Would you like to see the best forex card recommendations?" [TARGET: forex-card]
   - debit card / daily spending -> "Would you like to see the top-rated debit cards?" [TARGET: debit-card]
   - credit card / rewards -> "Would you like to explore premium credit card recommendations?" [TARGET: credit-card]
   - bank comparison / best bank -> "Would you like to compare top Indian banks side-by-side?" [TARGET: banks]
   - investment / savings growth -> "Would you like to see AI-driven investment strategies?" [TARGET: investments]
   - loan / EMI / borrowing -> "Would you like to view your loan options and EMI calculator?" [TARGET: loans]
   - bank account / account opening -> "Would you like to see the step-by-step account opening guide?" [TARGET: account-guide]
   - forex transfer / sending money abroad -> "Would you like to calculate your exact forex transfer savings?" [TARGET: forex-transfer]

Respond with only the explanation. If a suggestion is relevant, append the suggestion text and target in this format:
[SUGGESTION: Prompt Text] [TARGET: target-name]`;

export const callGroqAPI = async (chatHistory, profileType, isAssistant = false) => {
  let systemPrompt;

  if (isAssistant) {
    systemPrompt = ASSISTANT_SYSTEM_PROMPT;
  } else {
    systemPrompt = `You are SmartBank AI, a professional AI financial assistant that helps users with banking, savings, investments, and financial planning.

IMPORTANT CONVERSATION RULES:

1. Never assume the user's background (student, working professional, or self-employed).
2. At the beginning of the conversation, always ask the user to select their profile before giving any financial advice.

Start the conversation by asking:

"To give you the best financial guidance, please tell me your profile:

1. Student
2. Working Professional
3. Self-Employed
4. Other"

Wait for the user's response before continuing.

3. Once the user selects their profile, continue the conversation accordingly:

If the user selects STUDENT:
* Ask about monthly pocket money or income.
* Suggest beginner savings strategies.
* Recommend small investments like SIPs or savings accounts.
* Give budgeting advice for students.

If the user selects WORKING PROFESSIONAL:
* Ask about monthly salary range.
* Provide guidance on savings allocation (50/30/20 rule).
* Suggest investments like mutual funds, stocks, and emergency funds.

If the user selects SELF-EMPLOYED:
* Ask about approximate monthly income and income stability.
* Suggest maintaining emergency funds.
* Recommend diversified investments like mutual funds, fixed deposits, and retirement planning.

4. Always ask questions step-by-step instead of assuming information.

5. Provide financial suggestions in simple categories:
* Savings
* Investments
* Expense control
* Emergency fund planning

6. If user expenses are too high compared to income, politely warn them and suggest reducing unnecessary spending.
Example response when spending is too high: "Your spending seems higher than recommended. Consider reducing expenses in categories like entertainment or travel and allocate more toward savings."

7. Always be polite, simple, and conversational.

8. If the user asks about creating a bank account, guide them step-by-step through the process.

9. If the user asks about investments, explain options like:
* Mutual Funds (SIP)
* Stocks
* Fixed Deposits
* Emergency Funds

10. Your goal is to act like a smart financial advisor that helps users improve their financial health.
Never assume user information. Always ask first.

USER INPUT HANDLING RULES:
Your most important responsibility is to understand what the user is trying to say, even if the input is incomplete, contains spelling mistakes, or does not exactly match the expected format.
1. Always analyze the user's message carefully before responding.
2. If the user gives a response that does not exactly match the expected options, try to understand the user's intent instead of rejecting the answer.

SCENARIO 1 — USER TYPES PARTIAL OR RELATED INFORMATION
Example: User types: "I have 500 pocket money"
Even if the AI asked "Which bank would you like to choose?", recognize that the user is talking about income.
Respond like this: "Thanks for sharing your monthly pocket money of ₹500. Based on this, a Zero Balance Savings Account would be the best option for you. Here are some recommended banks..."
Then continue the conversation normally.

SCENARIO 2 — USER TYPES A NUMBER OR OPTION
Example: User types: "1"
Interpret this as selecting the first option in the list.
Example response: "You selected SBI Student Account. I can guide you through the steps to open this account."

SCENARIO 3 — USER TYPES BANK NAME DIRECTLY
Example: User types: "SBI"
Interpret this as the user choosing SBI.
Respond: "Great choice. The SBI Student Account is a zero-balance account designed for students."
Then guide them through the account creation process.

SCENARIO 4 — USER TYPES SOMETHING UNRELATED
Example: User types: random text or unclear message.
Respond politely: "I'm not sure I fully understood your response. Could you please choose one of the following options or tell me how I can help you?"

SCENARIO 5 — USER CHANGES THE TOPIC
Example: User types: "I want investment advice"
Switch the conversation to the investment module and help the user accordingly.

INTELLIGENT RESPONSE RULES:
* Never strictly require exact option matching.
* Always try to interpret the user's intention.
* If the user shares financial information like income, spending, or savings, use that information to guide the conversation.
* Be flexible and adaptive in responses.

CONVERSATION STYLE:
* Friendly and professional
* Short and clear responses
* Always guide the user step-by-step
Your goal is to behave like a smart banking assistant that understands real human input, even if it is messy, incomplete, or slightly incorrect.`;
  }
  const userProfileInfo = `\n\nThe user's current selected profile (if any) is: ${profileType || 'Unknown'}.`;
  if (!isAssistant) {
    systemPrompt += userProfileInfo;
  }

  const safeHistory = chatHistory.slice(-10);

  const messages = [
    { role: "system", content: systemPrompt },
    ...safeHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages
      })
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq API Error Details:", errorText);
      throw new Error(`Groq API returned ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
  } catch (error) {
    console.error("Assistant Error:", error);
    return "I'm currently unable to connect to my knowledge base. I can help you with cards, forex transfers, bank comparison, investments, and financial planning. Please ask your question again.";
  }
};

export const generateInvestmentExplanation = async (investmentName) => {
  const systemPrompt = `You are a professional financial assistant inside a banking dashboard.
The user wants to learn more about the following investment option: "${investmentName}".

Generate a detailed explanation about this investment.
The response MUST include the following 4 sections exactly formatted as markdown headers. Do not use any other formatting that breaks this structure.

### SECTION 3 — COMPANY OVERVIEW
Explain briefly:
* What the company/asset does
* Industry position
* Growth potential
Use simple language.

### SECTION 4 — AI INVESTMENT INSIGHTS
Provide AI analysis:
* Current Trend: (Bullish / Bearish / Stable)
* Best Strategy: (Long-term hold, SIP investment, or Buy on dips)
* Risk Level: (Low / Medium / High)

### SECTION 5 — PERFORMANCE INSIGHTS
Add a small summary showing:
* Past performance summary
* Revenue growth trend
* Market position

### SECTION 6 — RELATED STOCKS
Show similar companies or assets in the same sector. Provide a brief list.
Example: Reliance Industries, Tata Motors, Infosys, HDFC Bank.

IMPORTANT RULES:
* Use appropriate clear markdown headers.
* Keep explanations simple and professional.
* Make the UI response structured so it can be displayed easily in our investment insights panel.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Please explain ${investmentName}` }
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages
      })
    });
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Failed to generate investment explanation. Please try again later.";
  }
};

// Utilities for localized AI calculation (without making an API call every time)

export const calculateFinancialHealthScore = (income, expenses) => {
  if (!income || income === 0) return { score: 0, insights: [], suggestions: [] };
  
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  const savings = income - totalExpenses;
  const savingsRate = (savings / income) * 100;
  
  let score = 50; // Base score
  let insights = [];
  let suggestions = [];
  
  // Scoring logic based on savings rate
  if (savingsRate >= 20) {
    score += 30;
    insights.push("Your savings rate is excellent. You are following the 50/30/20 rule perfectly.");
  } else if (savingsRate >= 10) {
    score += 15;
    insights.push("Your savings rate is good, but you can aim to reach the 20% target.");
    suggestions.push("Try reducing your want-based spending to increase your monthly savings.");
  } else if (savingsRate > 0) {
    score += 5;
    insights.push("Your savings are quite low. This leaves little room for investments or emergencies.");
    suggestions.push("Review your expenses strongly. Look for areas to cut back immediately.");
  } else {
    score -= 20;
    insights.push("You are spending more than you earn. This is a risky financial situation.");
    suggestions.push("You must urgently reduce spending to avoid debt accumulation.");
  }
  
  // Basic expense analysis
  if (expenses.food && (expenses.food / income) > 0.15) {
     score -= 5;
     insights.push("Food/dining expenses are slightly high relative to your income.");
     suggestions.push(`Try reducing food delivery spending by ₹${Math.round(expenses.food * 0.2)}/month.`);
  }

  if (expenses.shopping && (expenses.shopping / income) > 0.10) {
     score -= 5;
     insights.push("Shopping expenses are exceeding recommended limits.");
     suggestions.push("Move some money allocated to shopping towards long-term investments instead.");
  }
  
  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return { score, insights, suggestions };
};

export const getBudgetPlan = (income) => {
  if (!income || income === 0) return null;
  
  return {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2
  };
};

export const generateSmartInvestmentAdvice = (marketData) => {
  // Logic to dynamically spit out AI text based on mock market data
  let text = "Today the market is showing a ";
  text += marketData.marketTrend === "bullish" ? "strong upward trend. " : "slight correction. ";
  
  const topGainer = marketData.topGainers[0];
  if (topGainer) {
      text += `${topGainer.name} and other related stocks are showing upward momentum today. `;
  }
  
  if (marketData.gold24k.isPositive) {
      text += `Gold prices are rising today by ${marketData.gold24k.percentChange}%. It may be a good time to consider investments in digital gold for portfolio stability. `;
  }
  
  return text;
};

export const calculateGoalPlan = (targetAmount, currentAmount, durationMonths) => {
  const remainingTarget = targetAmount - currentAmount;
  if(remainingTarget <= 0) return { monthlyRequired: 0, plan: "Goal already achieved!" };
  
  const monthlyRequired = Math.ceil(remainingTarget / durationMonths);
  const sipInvestment = Math.ceil(monthlyRequired * 0.6); // 60% in somewhat aggressive (SIP)
  const safeSavings = monthlyRequired - sipInvestment; // 40% in safe savings (FD/RD)
  
  return {
      monthlyRequired,
      planHtml: `• Save ₹${safeSavings}/month in bank account (RD)<br/>• Invest ₹${sipInvestment}/month in SIP (Index Mutual Fund)`
  };
};

// Bank Comparison AI Utilities

export const generateBankRankings = (banksArray) => {
  // AI Simulation sorting logic based on 0-balance, ease of opening, penalties, etc.
  return [...banksArray].sort((a, b) => {
    let scoreA = a.easeOfOpening * 2 + a.digitalFeatures * 1.5;
    let scoreB = b.easeOfOpening * 2 + b.digitalFeatures * 1.5;

    // Zero balance gives a high boost to rankings
    if (a.minBalance === 0) scoreA += 20;
    if (b.minBalance === 0) scoreB += 20;

    // High penalties negatively impact score
    scoreA -= (a.penalty / 100);
    scoreB -= (b.penalty / 100);

    return scoreB - scoreA;
  });
};

export const generateBankRecommendations = (banksArray) => {
  // Filter and pick one representative for the recommended categories
  const bestForStudents = banksArray.find(b => b.category === 'Best for Students' || (b.minBalance === 0 && !b.onlineOpening));
  const bestDigital = banksArray.find(b => b.category === 'Best Digital Bank' || (b.minBalance === 0 && b.onlineOpening));
  const bestProfessional = banksArray.find(b => b.category === 'Best for Professionals' || b.minBalance > 1000);
  const bestLowFee = banksArray.find(b => b.category === 'Best Low Fee Account' || (b.penalty < 500 && b.minBalance > 0));

  return {
    student: bestForStudents,
    digital: bestDigital,
    professional: bestProfessional,
    lowfee: bestLowFee
  };
};

// Credit Card AI Utilities

export const checkCreditCardEligibility = (userProfile, card) => {
  const { minIncome } = card.eligibility;
  if (userProfile.income >= minIncome) {
    return {
      eligible: true,
      message: "You are likely eligible for this credit card."
    };
  } else {
    return {
      eligible: false,
      message: `You may need higher income. (Req: ₹${minIncome.toLocaleString()}/mo)`
    };
  }
};

export const generateCreditCardAdvice = (userProfile, creditCards) => {
  // Logic to recommend standard categorizations
  const bestForOnline = creditCards.find(c => c.category === 'Online Shopping');
  const bestForBeginners = creditCards.find(c => c.category === 'Beginners');
  const bestForAmazon = creditCards.find(c => c.category === 'Amazon Users');

  // Logic to simulate a personalized recommendation based on mock user expenses
  const { expenses } = userProfile;
  let topRecommendation = null;
  let recommendationReason = "";
  
  // Find highest expense category
  const expenseEntries = Object.entries(expenses).filter(([cat]) => cat !== 'rent' && cat !== 'other');
  let highestExpense = { category: '', amount: 0 };
  
  expenseEntries.forEach(([cat, amount]) => {
      if (amount > highestExpense.amount) {
          highestExpense = { category: cat, amount };
      }
  });

  if (highestExpense.category === 'food' || highestExpense.category === 'shopping') {
      topRecommendation = creditCards.find(c => c.category === 'Online Shopping' || c.category === 'Amazon Users');
      recommendationReason = `Since you spend a significant amount (₹${highestExpense.amount.toLocaleString()}) on ${highestExpense.category}, a high cashback card like ${topRecommendation.name} is ideal for you.`;
  } else if (highestExpense.category === 'travel') {
      topRecommendation = creditCards.find(c => c.category === 'Travel');
      if (topRecommendation) {
        recommendationReason = `Given your travel expenses (₹${highestExpense.amount.toLocaleString()}), the ${topRecommendation.name} with its lounge access and travel perks is your best bet.`;
      }
  }

  // Fallback if no matching high-end card is found
  if (!topRecommendation) {
      topRecommendation = bestForBeginners;
      recommendationReason = `As a solid base card with low fees, ${topRecommendation.name} is a great starting point.`;
  }

  return {
    personalizedCard: topRecommendation,
    reason: recommendationReason,
    categories: {
      online: bestForOnline,
      beginner: bestForBeginners,
      amazon: bestForAmazon
    }
  };
};

// Loan & EMI Utilities
export const calculateEMI = (principal, annualInterestRate, tenureYears) => {
  if (!principal || !annualInterestRate || !tenureYears) return 0;
  
  const p = parseFloat(principal);
  const r = parseFloat(annualInterestRate) / 12 / 100; // Monthly interest rate
  const n = parseFloat(tenureYears) * 12; // Total number of months
  
  if (r === 0) return Math.round(p / n);
  
  const emi = p * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

export const checkLoanEligibility = (userProfile, loanDetails) => {
  const { income } = userProfile;
  const { minIncome, creditScoreRecommended } = loanDetails;

  const isEligible = income >= minIncome;
  let reason = isEligible 
      ? `You are likely eligible for this loan.` 
      : `You may need higher income (Req: ₹${minIncome.toLocaleString()}/mo) or better credit score.`;

  return { eligible: isEligible, reason, creditScoreRecommended };
};

export const generateBestLoanRecommendation = (loansList, loanType = 'Personal Loan') => {
  const filteredLoans = loansList.filter(l => l.type === loanType);
  if (filteredLoans.length === 0) return null;

  // Best recommendation logic: Lowest interest rate, then fastest processing
  const bestBank = filteredLoans.sort((a, b) => {
      if (a.interestRate !== b.interestRate) return a.interestRate - b.interestRate;
      return a.processingFee - b.processingFee;
  })[0];

  return {
      bank: bestBank.bank,
      reason: `Lowest interest rate (${bestBank.interestRate}%) and fast approval time (${bestBank.approvalTime}).`
  };
};

export const simulateAIOCRAnalysis = async (fileName) => {
  // Simulate network delay for OCR processing
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const name = fileName.toLowerCase();
  let typeKey = 'bankStatement'; // default
  
  if (name.includes('salary') || name.includes('payslip')) typeKey = 'salary';
  else if (name.includes('credit') || name.includes('bill')) typeKey = 'ccBill';
  else if (name.includes('invest') || name.includes('portfolio')) typeKey = 'investment';
  
  return typeKey;
};

// Advanced Loan Analytics
export const calculatePrepaymentSavings = (principal, annualInterestRate, tenureYears, prepaymentAmount, monthOfPrepayment = 12) => {
  if (!principal || !annualInterestRate || !tenureYears || !prepaymentAmount) return 0;
  
  const p = parseFloat(principal);
  const r = parseFloat(annualInterestRate) / 12 / 100;
  const n = parseFloat(tenureYears) * 12;
  
  if (r === 0) return 0;
  
  const emi = p * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const originalTotalInterest = (emi * n) - p;
  
  let outstandingPrincipal = p;
  let interestPaidTillDate = 0;
  
  for (let i = 1; i <= monthOfPrepayment; i++) {
    let intForMonth = outstandingPrincipal * r;
    let prinForMonth = emi - intForMonth;
    interestPaidTillDate += intForMonth;
    outstandingPrincipal -= prinForMonth;
  }
  
  const newOutstanding = outstandingPrincipal - parseFloat(prepaymentAmount);
  if (newOutstanding <= 0) {
     return Math.round(originalTotalInterest - interestPaidTillDate); 
  }

  const remainingMonths = n - monthOfPrepayment;
  const newEmi = newOutstanding * r * (Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1);
  const newTotalInterestRemaining = (newEmi * remainingMonths) - newOutstanding;

  const totalInterestWithPrepayment = interestPaidTillDate + newTotalInterestRemaining;
  return Math.round(Math.max(0, originalTotalInterest - totalInterestWithPrepayment));
};

export const checkAffordability = (monthlyIncome, emi) => {
  if (!monthlyIncome || monthlyIncome <= 0) return null;
  const income = parseFloat(monthlyIncome);
  const maxSafeEmi = income * 0.40; // 40% rule
  
  if (emi <= maxSafeEmi) {
    return {
      isAffordable: true,
      maxEmi: Math.round(maxSafeEmi),
      message: "This loan is affordable based on your income."
    };
  } else {
    return {
      isAffordable: false,
      maxEmi: Math.round(maxSafeEmi),
      message: "This loan EMI may be too high for your current income. Consider extending the tenure or reducing the loan amount."
    };
  }
};

export const calculateLoanTimeline = (tenureYears) => {
  if (!tenureYears) return null;
  
  const months = tenureYears * 12;
  const days = tenureYears * 365; 

  const today = new Date();
  const completionDate = new Date(today);
  completionDate.setFullYear(today.getFullYear() + tenureYears);
  
  const formattedDate = completionDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return {
    months,
    days,
    formattedDate
  };
};
