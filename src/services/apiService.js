/**
 * src/services/apiService.js
 * 
 * Bridge service that routes legacy imports to new domain-specific services.
 * This ensures the UI components don't break while migrating to GraphQL.
 */

import * as bankService from './bankService';
import * as cardService from './cardService';
import * as investmentService from './investmentService';
import * as loanService from './loanService';
import * as userService from './userService';
import { documents, dailyMarketData, initialFinancialGoals } from '../data/mockData';

export const getBanks = bankService.getBanks;
export const getCreditCards = cardService.getCreditCards;
export const getForexCards = cardService.getForexCards;
export const getDebitCards = cardService.getDebitCards;
export const getInvestments = investmentService.getInvestments;
export const getUserProfile = userService.getUserProfile;
export const createLoan = loanService.createLoan;
export const getLoans = loanService.getLoans;
export const createInvestment = investmentService.createInvestment;

// Still mock for now (no backend module yet)
export const getDocuments = async () => documents;
export const getDailyMarketData = async () => dailyMarketData;
export const getFinancialGoals = async () => initialFinancialGoals;

export const getDashboard = async () => {
  const userProfile = await userService.getUserProfile();
  return {
    userProfile,
    financialGoals: initialFinancialGoals
  };
};
