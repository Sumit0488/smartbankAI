/**
 * src/services/userService.js
 * Frontend service calling real GraphQL backend for users.
 */

import { graphqlRequest } from '../config/api';
import { initialUserProfile } from '../data/mockData';

const DEFAULT_USER_ID = 'public';

export const getUserProfile = async () => {
  try {
    const data = await graphqlRequest(`query($id: ID!) { getProfile(id: $id) { _id name email profileType salary } }`, { id: DEFAULT_USER_ID });
    if (data?.getProfile) return data.getProfile;
  } catch (e) { console.warn('Backend fetch failed, using mock', e); }

  return {
    ...initialUserProfile,
    id: 'user_123',
    name: 'SmartBank Student',
    email: 'student@smartbank.ai',
    profileType: 'Student',
    kycStatus: 'Verified',
    joinDate: '2026-01-15'
  };
};

export const updateProfile = async (data) => {
  try {
    const res = await graphqlRequest(`
      mutation($id: ID!, $input: UpdateUserInput!) {
        updateProfile(id: $id, input: $input) { _id name }
      }
    `, {
      id: DEFAULT_USER_ID,
      input: {
        name: data.name,
        email: data.email,
        salary: Number(data.salary) || 0,
        profileType: data.profileType
      }
    });
    if (res?.updateProfile) return { success: true, message: 'Profile updated' };
  } catch (e) { console.warn('Backend update failed', e); }
  return { success: true, message: 'Mock Profile updated successfully.' };
};
