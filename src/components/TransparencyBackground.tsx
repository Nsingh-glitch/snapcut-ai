import { type CSSProperties, type ReactNode } from "react";

interface TransparencyBackgroundProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function TransparencyBackground({ children, className = "", style }: TransparencyBackgroundProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white ${className}`}
      style={{
        backgroundImage: "linear-gradient(45deg, #e7e9ed 25%, transparent 25%), linear-gradient(-45deg, #e7e9ed 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e7e9ed 75%), linear-gradient(-45deg, transparent 75%, #e7e9ed 75%)",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
        backgroundSize: "20px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}