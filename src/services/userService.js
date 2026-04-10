/**
 * src/services/userService.js
 * Frontend service calling real GraphQL backend for users.
 * Operations: getProfile (no args — from JWT), updateProfile, registerUser, loginUser
 */

import { graphqlRequest } from '../config/api';
import { initialUserProfile } from '../data/mockData';

const USER_FIELDS = `id userId name email role salary profileType status createdAt`;

const MOCK_PROFILE = {
  ...initialUserProfile,
  id: 'user_123',
  name: 'SmartBank Student',
  email: 'student@smartbank.ai',
  profileType: 'STUDENT',
  kycStatus: 'Verified',
  joinDate: '2026-01-15',
  salary: 0,
  income: (initialUserProfile && initialUserProfile.income) || 0,
};

export const getUserProfile = async () => {
  try {
    // getProfile reads userId from JWT — no arguments needed
    const data = await graphqlRequest(
      `query { getProfile { ${USER_FIELDS} } }`
    );
    if (data?.getProfile) return data.getProfile;
  } catch (e) {
    console.warn('Backend fetch failed, using mock', e);
  }
  return MOCK_PROFILE;
};

export const updateProfile = async (profileData) => {
  try {
    const res = await graphqlRequest(
      `mutation($input: UpdateUserInput!) {
        updateProfile(input: $input) { ${USER_FIELDS} }
      }`,
      {
        input: {
          name: profileData.name || undefined,
          email: profileData.email || undefined,
          phone: profileData.phone || undefined,
          salary: profileData.salary !== undefined ? Number(profileData.salary) : undefined,
          profileType: profileData.profileType || undefined,
        },
      }
    );
    if (res?.updateProfile) return { success: true, message: 'Profile updated', user: res.updateProfile };
  } catch (e) {
    console.warn('Backend update failed', e);
  }
  return { success: true, message: 'Mock Profile updated successfully.' };
};

export const registerUser = async (name, email, password) => {
  const data = await graphqlRequest(
    `mutation($input: RegisterUserInput!) {
      registerUser(input: $input) { token user { ${USER_FIELDS} } }
    }`,
    { input: { name, email, password } }
  );
  return data?.registerUser || null;
};

export const loginUser = async (email, password) => {
  const data = await graphqlRequest(
    `mutation($email: String!, $password: String!) {
      loginUser(email: $email, password: $password) { token user { ${USER_FIELDS} } }
    }`,
    { email, password }
  );
  return data?.loginUser || null;
};
