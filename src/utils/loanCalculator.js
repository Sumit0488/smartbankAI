export const calculateEMI = (principal, annualInterestRate, tenureMonths) => {
  const r = annualInterestRate / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return principal / n;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

export const calculateTotalInterest = (emi, tenureMonths, principal) => {
  return Math.round((emi * tenureMonths) - principal);
};
