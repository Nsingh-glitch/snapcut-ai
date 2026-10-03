import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TransparencyBackground } from "@/components/TransparencyBackground";

interface BeforeAfterSliderProps {
  originalImage: string;
  processedImage: string;
}

export function BeforeAfterSlider({ originalImage, processedImage }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  };

  return (
    <div
      ref={frameRef}
      className="relative aspect-[16/10] w-full cursor-default overflow-hidden rounded-xl border border-border/70 bg-muted shadow-2xl touch-none select-none"
      style={{ containerType: "inline-size" }}
      onPointerDown={(event) => {
        event.preventDefault();
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updatePosition(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging) updatePosition(event.clientX);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
      }}
      onLostPointerCapture={() => setDragging(false)}
    >
      <TransparencyBackground className="absolute inset-0 rounded-none">
        <img
          src={processedImage}
          alt="Background removed sample"
          className="pointer-events-none h-full w-full select-none object-contain p-8 [-webkit-user-drag:none]"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
          Background Removed
        </span>
      </TransparencyBackground>
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${position}%` }}>
        <div className="relative h-full w-[100cqw] bg-slate-950">
          <img
            src={originalImage}
            alt="Original sample"
            className="pointer-events-none h-full w-full select-none object-contain p-8 [-webkit-user-drag:none]"
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
          />
          <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Original
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}>
        <div className="h-full w-px bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.2),0_0_16px_rgba(255,255,255,0.7)]" />
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg">
          <ArrowLeft className="h-4 w-4" />
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}