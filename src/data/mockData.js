export const banks = [
  {
    id: 'sbi-basic',
    name: 'SBI Basic Savings',
    minBalance: 0,
    onlineOpening: false,
    debitCard: true,
    bestFor: 'Students and Beginners',
    category: 'Best for Students',
    penalty: 0,
    easeOfOpening: 5,
    digitalFeatures: 4,
    hiddenCharges: []
  },
  {
    id: 'kotak-811',
    name: 'Kotak 811 Digital',
    minBalance: 0,
    onlineOpening: true,
    debitCard: true,
    bestFor: 'Fully Online & Students',
    category: 'Best Digital Bank',
    penalty: 0,
    easeOfOpening: 9,
    digitalFeatures: 8,
    hiddenCharges: []
  },
  {
    id: 'hdfc-digisave',
    name: 'HDFC DigiSave Youth',
    minBalance: 5000,
    onlineOpening: true,
    debitCard: true,
    bestFor: 'Students with active digital banking',
    category: 'Best for Professionals',
    penalty: 300,
    easeOfOpening: 7,
    digitalFeatures: 9,
    hiddenCharges: [
      { name: "Non-maintenance Penalty", amount: 300, condition: "If balance drops below ₹5,000" }
    ]
  },
  {
    id: 'axis-asap',
    name: 'Axis ASAP Digital',
    minBalance: 10000,
    onlineOpening: true,
    debitCard: true,
    bestFor: 'Working Professionals',
    category: 'Best Low Fee Account',
    penalty: 600,
    easeOfOpening: 8,
    digitalFeatures: 8,
    hiddenCharges: [
      { name: "Non-maintenance Penalty", amount: 600, condition: "If balance drops below ₹10,000" },
      { name: "Debit Card Annual Fee", amount: 500, condition: "Charged from 2nd year onwards" }
    ]
  },
  {
    id: 'hdfc-regular',
    name: 'HDFC Savings Account',
    minBalance: 10000,
    onlineOpening: true,
    debitCard: true,
    bestFor: 'Working Professionals',
    category: 'Premium Banking',
    penalty: 600,
    easeOfOpening: 7,
    digitalFeatures: 9,
    hiddenCharges: [
      { name: "Non-maintenance Penalty", amount: 600, condition: "If balance drops below ₹10,000" }
    ]
  }
];

export const creditCards = [
  {
    id: 'hdfc-millennia',
    name: 'HDFC Millennia Credit Card',
    bank: 'HDFC Bank',
    bestFor: 'Cashback on online shopping',
    category: 'Online Shopping',
    fee: 1000,
    benefits: [
      { type: 'Cashback', desc: '5% Cashback on Amazon, Flipkart & Myntra' },
      { type: 'Cashback', desc: '1% Cashback on all other offline/online spends' },
      { type: 'Lounge', desc: '1 complimentary domestic lounge access per quarter' },
      { type: 'Milestone', desc: '₹1000 gift voucher on spending ₹1 lakh per calendar quarter' }
    ],
    eligibility: {
      minIncome: 35000,
      minAge: 21,
      creditScoreRecommended: 700
    }
  },
  {
    id: 'sbi-simplyclick',
    name: 'SBI SimplyCLICK Credit Card',
    bank: 'SBI',
    bestFor: 'Amazon and Flipkart users',
    category: 'Amazon Users',
    fee: 499,
    benefits: [
      { type: 'Rewards', desc: '10X Reward Points on online spends with exclusive partners (Amazon, Apollo24X7, BookMyShow, Cleartrip, EazyDiner, Netmeds)' },
      { type: 'Rewards', desc: '5X Reward Points on all other online spends' },
      { type: 'Welcome Feature', desc: 'Amazon.in gift card worth ₹500 on joining' },
      { type: 'Fee Waiver', desc: 'Annual fee waiver on spending ₹1 Lakh in a year' }
    ],
    eligibility: {
      minIncome: 20000,
      minAge: 21,
      creditScoreRecommended: 650
    }
  },
  {
    id: 'axis-neo',
    name: 'Axis Neo Credit Card',
    bank: 'Axis Bank',
    bestFor: 'Discounts on online services',
    category: 'Beginners',
    fee: 250,
    benefits: [
      { type: 'Discounts', desc: '10% off on Blinkit, Myntra, and BookMyShow' },
      { type: 'Discounts', desc: '40% off on Zomato delivery' },
      { type: 'Cashback', desc: '5% cashback on utility bill payments via Amazon Pay' },
      { type: 'Rewards', desc: '1 Edge Reward point for every ₹200 spent' }
    ],
    eligibility: {
      minIncome: 15000,
      minAge: 18,
      creditScoreRecommended: 0
    }
  },
  {
    id: 'sbi-prime',
    name: 'SBI PRIME Credit Card',
    bank: 'SBI',
    bestFor: 'Travel and premium benefits',
    category: 'Travel',
    fee: 2999,
    benefits: [
      { type: 'Lounge', desc: '4 complimentary International Priority Pass Lounge visits per year' },
      { type: 'Lounge', desc: '8 complimentary Domestic VISA/Mastercard Lounge visits per year' },
      { type: 'Rewards', desc: '20 Reward Points per ₹100 spent on utility bills' },
      { type: 'Voucher', desc: 'Welcome e-gift voucher worth ₹3,000 from top brands' }
    ],
    eligibility: {
      minIncome: 50000,
      minAge: 21,
      creditScoreRecommended: 750
    }
  }
];

export const forexCards = [
  {
    id: 'niyo-global',
    name: 'Niyo Global Card',
    bank: 'DCB Bank / Equitas',
    bestFor: 'Students and Travelers',
    category: 'Forex Card',
    fee: 0,
    forexMarkup: '0%',
    benefits: [
      { type: 'Markup', desc: 'Zero Forex Markup on all transactions' },
      { type: 'App', desc: 'Real-time currency converter in app' },
      { type: 'Lounge', desc: 'Complimentary airport lounge access' }
    ],
    rewards: 'Niyo Coins on every spend',
    eligibility: { minIncome: 0, userType: ['Student', 'Traveler'] }
  },
  {
    id: 'sbi-vishwa',
    name: 'SBI Vishwa Yatra Card',
    bank: 'SBI',
    bestFor: 'General Travelers',
    category: 'Forex Card',
    fee: 250,
    forexMarkup: '0.5%',
    benefits: [
      { type: 'Security', desc: 'Chip and PIN protected' },
      { type: 'Currency', desc: 'Load up to 9 currencies' },
      { type: 'ATM', desc: 'Low international ATM withdrawal fees' }
    ],
    rewards: 'Standard bank points',
    eligibility: { minIncome: 20000, userType: ['Traveler', 'Business Owner'] }
  },
  {
    id: 'hdfc-multicurrency',
    name: 'HDFC Multicurrency Card',
    bank: 'HDFC Bank',
    bestFor: 'Business Travelers',
    category: 'Forex Card',
    fee: 500,
    forexMarkup: '1%',
    benefits: [
      { type: 'Protection', desc: 'Insurance cover for card fraud' },
      { type: 'Contactless', desc: 'Tap and pay globally' },
      { type: 'Reload', desc: 'Instant online reloading' }
    ],
    rewards: '5x Reward Points on overseas dining',
    eligibility: { minIncome: 30000, userType: ['Working Professional', 'Business Owner'] }
  }
];

export const debitCards = [
  {
    id: 'hdfc-millennia-debit',
    name: 'HDFC Millennia Debit Card',
    bank: 'HDFC Bank',
    bestFor: 'Daily Spending & Rewards',
    category: 'Debit Card',
    fee: 500,
    benefits: [
      { type: 'Cashback', desc: '5% cashback on PayZapp & SmartBuy' },
      { type: 'Cashback', desc: '2.5% cashback on all online spends' },
      { type: 'Lounge', desc: '1 complimentary domestic lounge access per quarter' }
    ],
    rewards: 'Max ₹400 cashback per month',
    eligibility: { minIncome: 25000, userType: ['Working Professional', 'Student'] }
  },
  {
    id: 'icici-coral-debit',
    name: 'ICICI Coral Debit Card',
    bank: 'ICICI Bank',
    bestFor: 'Entertainment & Dining',
    category: 'Debit Card',
    fee: 599,
    benefits: [
      { type: 'Movies', desc: 'Buy 1 Get 1 free on BookMyShow' },
      { type: 'Dining', desc: 'Minimum 15% savings at 2500+ restaurants' },
      { type: 'Rewards', desc: 'Payback points on every purchase' }
    ],
    rewards: 'High value reward points',
    eligibility: { minIncome: 30000, userType: ['Working Professional', 'Traveler'] }
  },
  {
    id: 'axis-liberty-debit',
    name: 'Axis Liberty Debit Card',
    bank: 'Axis Bank',
    bestFor: 'Lifestyle & Weekend Spends',
    category: 'Debit Card',
    fee: 500,
    benefits: [
      { type: 'Cashback', desc: '5% cashback on food, entertainment & shopping' },
      { type: 'Offer', desc: 'Weekend spending boosters' },
      { type: 'Insurance', desc: 'Personal accident cover of ₹5 Lakhs' }
    ],
    rewards: 'Edge rewards points',
    eligibility: { minIncome: 20000, userType: ['Working Professional', 'Student'] }
  }
];

export const documents = {
  students: [
    'Aadhaar card',
    'PAN card',
    'College ID',
    'Passport size photo'
  ],
  professionals: [
    'Aadhaar card',
    'PAN card',
    '3 months Salary slip',
    'Address proof (e.g., utility bill)'
  ]
};

export const investments = [
  {
    type: 'Mutual Funds',
    description: 'Good for long term wealth creation via SIP.',
    suggestions: ['UTI Nifty 50 Index Fund', 'SBI Nifty Index Fund', 'HDFC Index Fund']
  },
  {
    type: 'Stocks',
    description: 'Direct equity for long-term learning and dividends.',
    suggestions: ['Reliance Industries', 'TCS', 'Infosys', 'HDFC Bank', 'Asian Paints']
  },
  {
    type: 'Safe Instruments',
    description: 'Low risk, guaranteed returns.',
    suggestions: ['Fixed Deposits', 'Recurring Deposits', 'Digital Gold']
  }
];

// Initial user profile
export const initialUserProfile = {
  income: 30000,
  healthScore: 78,
  expenses: {
    food: 4200,
    travel: 2100,
    shopping: 3500,
    rent: 12000,
    other: 1500,
  },
  activeLoan: {
    bank: 'HDFC',
    amount: 500000,
    emi: 16607,
    nextPaymentDate: '15 April',
    type: 'Personal Loan',
    remainingMonths: 36,
    loanEnds: 'March 2029'
  }
};

// Daily Market Insights Mock Data
export const dailyMarketData = {
  marketTrend: "bullish",
  summary: "Today the market is showing a positive trend. IT sector stocks are outperforming, whereas banking stocks are experiencing a slight correction.",
  nifty: { value: 22450.50, change: 180.20, percentChange: 0.81, isPositive: true },
  sensex: { value: 73800.25, change: 550.15, percentChange: 0.75, isPositive: true },
  gold24k: { value: 73500, change: 850, percentChange: 1.17, isPositive: true },
  topGainers: [
    { name: "TCS", symbol: "TCS", change: 3.2, price: 4120 },
    { name: "Infosys", symbol: "INFY", change: 2.8, price: 1680 },
    { name: "HCL Tech", symbol: "HCLTECH", change: 2.5, price: 1550 },
  ],
  topLosers: [
    { name: "HDFC Bank", symbol: "HDFCBANK", change: -1.2, price: 1450 },
    { name: "ITC", symbol: "ITC", change: -0.8, price: 420 },
    { name: "HUL", symbol: "HINDUNILVR", change: -0.5, price: 2350 },
  ]
};

// Mock Initial Financial Goals
export const initialFinancialGoals = [
  {
    id: 1,
    name: "Buy Laptop",
    targetAmount: 80000,
    currentAmount: 25000,
    durationMonths: 10,
    icon: "laptop"
  },
  {
    id: 2,
    name: "Emergency Fund",
    targetAmount: 150000,
    currentAmount: 120000,
    durationMonths: 6,
    icon: "shield"
  }
];

// Loan Advisor Mock Data
export const loans = [
  {
    id: 'sbi-personal',
    bank: 'SBI',
    type: 'Personal Loan',
    interestRate: 11.0,
    processingFee: 0.5,
    approvalTime: '3 days',
    minIncome: 15000,
    creditScoreRecommended: 650,
    maxAmount: 2000000,
    prepaymentPenalty: '3% after 6 months'
  },
  {
    id: 'hdfc-personal',
    bank: 'HDFC',
    type: 'Personal Loan',
    interestRate: 10.5,
    processingFee: 1.0,
    approvalTime: '24 hours',
    minIncome: 25000,
    creditScoreRecommended: 700,
    maxAmount: 4000000,
    prepaymentPenalty: 'Nil after 12 EMI'
  },
  {
    id: 'axis-personal',
    bank: 'Axis Bank',
    type: 'Personal Loan',
    interestRate: 11.2,
    processingFee: 0.75,
    approvalTime: '2 days',
    minIncome: 20000,
    creditScoreRecommended: 680,
    maxAmount: 2500000,
    prepaymentPenalty: '2% on outstanding'
  },
  {
    id: 'sbi-home',
    bank: 'SBI',
    type: 'Home Loan',
    interestRate: 8.5,
    processingFee: 0.35,
    approvalTime: '7 days',
    minIncome: 30000,
    creditScoreRecommended: 700,
    maxAmount: 10000000,
    prepaymentPenalty: 'Nil'
  },
  {
    id: 'hdfc-home',
    bank: 'HDFC',
    type: 'Home Loan',
    interestRate: 8.4,
    processingFee: 0.5,
    approvalTime: '5 days',
    minIncome: 35000,
    creditScoreRecommended: 750,
    maxAmount: 15000000,
    prepaymentPenalty: 'Nil'
  },
  {
    id: 'axis-car',
    bank: 'Axis Bank',
    type: 'Car Loan',
    interestRate: 8.75,
    processingFee: 0.5,
    approvalTime: '2 days',
    minIncome: 25000,
    creditScoreRecommended: 700,
    maxAmount: 2000000,
    prepaymentPenalty: 'Nil after 12 EMI'
  },
  {
    id: 'sbi-education',
    bank: 'SBI',
    type: 'Education Loan',
    interestRate: 9.5,
    processingFee: 0,
    approvalTime: '15 days',
    minIncome: 10000, // Often based on co-applicant
    creditScoreRecommended: 650,
    maxAmount: 4000000,
    prepaymentPenalty: 'Nil'
  },
  {
    id: 'hdfc-medical',
    bank: 'HDFC',
    type: 'Medical Loan',
    interestRate: 10.9,
    processingFee: 1.0,
    approvalTime: '24 hours',
    minIncome: 20000,
    creditScoreRecommended: 680,
    maxAmount: 1000000,
    prepaymentPenalty: '2% on outstanding'
  },
  {
    id: 'bajaj-electronics',
    bank: 'Bajaj Finserv',
    type: 'Electronics Purchase',
    interestRate: 0, // No Cost EMI illusion
    processingFee: 2.0,
    approvalTime: 'Instant',
    minIncome: 15000,
    creditScoreRecommended: 650,
    maxAmount: 200000,
    prepaymentPenalty: 'Nil'
  },
  {
    id: 'indusind-travel',
    bank: 'IndusInd',
    type: 'Travel Loan',
    interestRate: 12.0,
    processingFee: 1.5,
    approvalTime: '48 hours',
    minIncome: 30000,
    creditScoreRecommended: 700,
    maxAmount: 500000,
    prepaymentPenalty: '4% within 1 year'
  },
  {
    id: 'hdfc-bike',
    bank: 'HDFC',
    type: 'Bike Loan',
    interestRate: 9.9,
    processingFee: 1.0,
    approvalTime: 'Instant / 1 Day',
    minIncome: 15000,
    creditScoreRecommended: 680,
    maxAmount: 500000,
    prepaymentPenalty: '1% after 6 EMI'
  }
];

// Document Analysis Mock Responses
export const documentAnalysisTemplates = {
  salary: {
    type: 'Salary Slip',
    detectedIncome: 45000,
    insights: "Based on your verified income, you are eligible for premium credit cards and pre-approved personal loans up to ₹5,000,00.",
    warnings: []
  },
  ccBill: {
    type: 'Credit Card Bill',
    totalDue: 14500,
    minAmount: 1200,
    dueDate: "25th March",
    insights: "You are spending roughly 30% of your limit.",
    warnings: ["Paying only the minimum amount may lead to high interest charges. Always try to pay the total due."]
  },
  bankStatement: {
    type: 'Bank Statement',
    spending: 28500,
    categories: [
      { name: 'Food', amount: 8000 },
      { name: 'Shopping', amount: 6500 },
      { name: 'Travel', amount: 4000 }
    ],
    insights: "Your food and shopping expenses are higher than the recommended 30% threshold for 'Wants'.",
    warnings: ["Consider cutting down online food orders to route an extra ₹3000 into savings."]
  },
  investment: {
    type: 'Investment Report',
    mutualFunds: 60000,
    stocks: 85000,
    insights: "Your investments are heavily focused on direct equity (Stocks).",
    warnings: ["Consider adding more stability via Debt Mutual Funds or Index Funds to diversify risk."]
  }
};
