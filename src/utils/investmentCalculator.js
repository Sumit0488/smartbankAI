export const calculateSIPReturn = (monthlyInvestment, expectedAnnualReturn, years) => {
  const n = years * 12;
  const i = expectedAnnualReturn / 12 / 100;
  
  const futureValue = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const totalInvested = monthlyInvestment * n;
  const estimatedReturn = futureValue - totalInvested;
  
  return {
    futureValue: Math.round(futureValue),
    totalInvested: Math.round(totalInvested),
    estimatedReturn: Math.round(estimatedReturn)
  };
};

export const calculateLumpsumReturn = (principal, expectedAnnualReturn, years) => {
  const futureValue = principal * Math.pow((1 + expectedAnnualReturn / 100), years);
  const estimatedReturn = futureValue - principal;
  
  return {
    futureValue: Math.round(futureValue),
    principal: Math.round(principal),
    estimatedReturn: Math.round(estimatedReturn)
  };
};
