import React from 'react';

interface GoldToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const GoldToggleSwitch: React.FC<GoldToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${
        checked
          ? 'bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.35)]'
          : 'bg-[#1C2436] hover:bg-[#253046]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1 bg-slate-300'
        }`}
      />
    </button>
  );
};
