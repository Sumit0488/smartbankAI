/**
 * src/hooks/useUser.js
 * Wraps userService.getUserProfile with loading/error state.
 */
import { useState, useEffect } from 'react';
import { getUserProfile } from '../services/userService';

export const useUser = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await getUserProfile();
        if (!cancelled) setUserProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { userProfile, isLoading, error };
};
