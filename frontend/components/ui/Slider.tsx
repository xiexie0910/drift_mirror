/**
 * Slider Component
 * 
 * Calm Futurism Design
 * - Gradient teal track
 * - Glass-style thumb with glow
 * - Smooth animations
 */

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  label?: string;
}

export function Slider({ min, max, value, onChange, className = '', label }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="
          w-full h-2.5
          rounded-full 
          appearance-none 
          cursor-pointer
          bg-white/30
          backdrop-blur-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-teal-400 [&::-webkit-slider-thumb]:to-teal-500
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-teal-500/30
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
          [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-xl [&::-webkit-slider-thumb]:hover:shadow-teal-500/40
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-teal-400 [&::-moz-range-thumb]:to-teal-500
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-teal-500/30
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/50
        "
        style={{
          background: `linear-gradient(to right, 
            rgba(20, 184, 166, 0.8) 0%, 
            rgba(13, 148, 136, 0.9) ${percentage}%, 
            rgba(255, 255, 255, 0.3) ${percentage}%, 
            rgba(255, 255, 255, 0.2) 100%)`,
        }}
      />
    </div>
  );
}
