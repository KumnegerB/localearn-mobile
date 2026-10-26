import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export type TrustModalMode = 'auth' | null;

export const useRequireTrustAction = () => {
  const { user } = useAuthStore();
  const [modalMode, setModalMode] = useState<TrustModalMode>(null);
  const [actionTitle, setActionTitle] = useState<string>('continue');
  const pendingActionRef = useRef<(() => void) | null>(null);

  const requireTrustAction = useCallback(
    (action: () => void, title = 'continue') => {
      pendingActionRef.current = action;
      setActionTitle(title);

      if (!user) {
        setModalMode('auth');
        return;
      }

      // User is authenticated and email-verified
      action();
      pendingActionRef.current = null;
    },
    [user]
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
      setTimeout(() => {
        action();
      }, 100);
    }
  }, []);

  return {
    modalMode,
    actionTitle,
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  };
};
