import { useEffect } from 'react';
import { escapeManager } from '../utils/escapeKeyManager';

/**
 * Hook to automatically close a modal, dropdown, or popover when the Escape key is pressed.
 *
 * @param onClose Callback function to invoke when Escape is pressed.
 * @param isOpen Condition whether the popup is currently active / open.
 */
export function useEscapeKey(onClose?: () => void, isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    return escapeManager.register(onClose);
  }, [isOpen, onClose]);
}

export default useEscapeKey;
