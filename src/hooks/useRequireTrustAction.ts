import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export type TrustModalMode = 'auth' | 'verify' | null;

export const useRequireTrustAction = () => {
  const { user } = useAuthStore();
  const [modalMode, setModalMode] = useState<TrustModalMode>(null);
  const [actionTitle, setActionTitle] = useState<string>('continue');
  const pendingActionRef = useRef<(() => void) | null>(null);

  const isUserVerified = Boolean(
    user && (user.is_verified || user.telegram_username || user.phone_number)
  );

  const requireTrustAction = useCallback(
    (action: () => void, title = 'continue') => {
      pendingActionRef.current = action;
      setActionTitle(title);

      if (!user) {
        setModalMode('auth');
        return;
      }

      if (!isUserVerified) {
        setModalMode('verify');
        return;
      }

      // Both authenticated and verified
      action();
      pendingActionRef.current = null;
    },
    [user, isUserVerified]
  );

  const closeModal = useCallback(() => {
    setModalMode(null);
    pendingActionRef.current = null;
  }, []);

  const handleVerificationSuccess = useCallback(() => {
    setModalMode(null);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Execute pending action after modal dismiss
      setTimeout(() => {
        action();
      }, 250);
    }
  }, []);

  return {
    modalMode,
    actionTitle,
    isUserVerified,
    isAuthenticated: Boolean(user),
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  };
};
