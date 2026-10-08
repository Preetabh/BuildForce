// Global Escape Key Manager
// Handles closing any active modal, popover, dropdown, or assistant widget when Escape is pressed.

type EscapeHandler = () => void;

class EscapeKeyManager {
  private stack: EscapeHandler[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    window.addEventListener('keydown', this.handleKeyDown, true); // Capture phase to intercept reliably
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // 1. If explicit handlers are registered in the stack, invoke the topmost popup handler
      if (this.stack.length > 0) {
        const topHandler = this.stack[this.stack.length - 1];
        try {
          topHandler();
        } catch (err) {
          console.error('Error closing popup via Escape handler:', err);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 2. Fallback: Intelligent DOM detection for any open modal or popup overlay
      try {
        // Native <dialog> elements that are open
        const openNativeDialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));
        if (openNativeDialogs.length > 0) {
          const topDialog = openNativeDialogs[openNativeDialogs.length - 1];
          topDialog.close();
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Visible overlays and dialog containers
        const candidateSelectors = [
          '[role="dialog"]',
          '[aria-modal="true"]',
          '[data-modal-open="true"]',
          '.fixed.inset-0',
          '[class*="fixed"][class*="inset-0"]',
        ];
        const overlays = Array.from(
          document.querySelectorAll<HTMLElement>(candidateSelectors.join(', '))
        ).filter((el) => {
          // Exclude root background elements or non-modal containers
          if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'root') return false;
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });

        if (overlays.length > 0) {
          // Get the topmost overlay
          const topOverlay = overlays[overlays.length - 1];

          // 2a. Look for standard close button attributes
          let closeButton: HTMLButtonElement | null = null;
          const buttons = Array.from(topOverlay.querySelectorAll<HTMLButtonElement>('button'));

          for (const btn of buttons) {
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            const text = (btn.textContent || '').trim().toLowerCase();
            const hasXIcon = !!btn.querySelector('.lucide-x, [data-icon="x"], svg.lucide-x');

            if (
              ariaLabel.includes('close') ||
              ariaLabel.includes('cancel') ||
              ariaLabel.includes('dismiss') ||
              title.includes('close') ||
              title.includes('cancel') ||
              text === 'cancel' ||
              text === 'close' ||
              hasXIcon
            ) {
              closeButton = btn;
              break;
            }
          }

          if (closeButton) {
            closeButton.click();
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
      } catch (domErr) {
        console.warn('DOM fallback error during Escape key processing:', domErr);
      }

      // 3. Dispatch a global custom event so any open dropdowns or floating widgets can close
      window.dispatchEvent(new CustomEvent('app:escape-pressed'));
    }
  };

  /**
   * Register a close handler. Returns a cleanup unregister function.
   */
  public register(handler: EscapeHandler): () => void {
    this.stack.push(handler);
    return () => {
      this.unregister(handler);
    };
  }

  /**
   * Remove a close handler from the stack.
   */
  public unregister(handler: EscapeHandler) {
    this.stack = this.stack.filter((h) => h !== handler);
  }
}

export const escapeManager = new EscapeKeyManager();
