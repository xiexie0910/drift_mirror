interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({ min, max, value, onChange, className = '' }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-drift-600"
        style={{
          background: `linear-gradient(to right, #16a34a ${percentage}%, #e5e7eb ${percentage}%)`,
        }}
      />
    </div>
  );
}
