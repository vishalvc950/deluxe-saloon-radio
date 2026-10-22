import { useEffect, useRef } from "react";
import { RainEngine } from "../lib/rain";

/* Full-viewport rain + lightning layer. Mounted once; engine start/stop
   follows the `on` prop so the 0.8 s CSS fade reads smoothly. */
export default function RainOverlay({ on }: { on: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RainEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !flashRef.current) return;
    engineRef.current = new RainEngine(canvasRef.current, flashRef.current);
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (on) engineRef.current?.start();
    else engineRef.current?.stop();
  }, [on]);

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-700"
      style={{ opacity: on ? 1 : 0 }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div ref={flashRef} className="absolute inset-0 bg-white opacity-0" />
    </div>
  );
}
