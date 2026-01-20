/**
 * Toggle Component
 * 
 * Calm Futurism Design
 * - Gradient teal active state with glow
 * - Glass-style track
 * - Smooth transitions
 */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export function Toggle({ checked, onChange, className = '', label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 
        items-center rounded-full 
        transition-all duration-300 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2
        ${checked 
          ? 'bg-gradient-to-r from-teal-400 to-teal-500 shadow-lg shadow-teal-500/30' 
          : 'bg-white/40 backdrop-blur-sm border border-white/50'
        }
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 
          transform rounded-full 
          transition-all duration-300 ease-out
          ${checked 
            ? 'translate-x-6 bg-white shadow-lg' 
            : 'translate-x-1 bg-white/80 shadow-md'
          }
        `}
      />
    </button>
  );
}
