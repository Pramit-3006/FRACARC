'use client';

import { useEffect, useRef, useState } from 'react';

type Annotation = {
  label: string;
  bbox: [number, number, number, number];
  author: string;
};

type AnnotationCanvasProps = {
  imageSrc?: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
};

export function AnnotationCanvas({ imageSrc, annotations, onChange }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<[number, number, number, number] | null>(null);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((annotation) => {
      const [x1, y1, x2, y2] = annotation.bbox;
      ctx.strokeStyle = '#4fd1c5';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = '#4fd1c5';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(annotation.label, x1 + 6, y1 + 16);
    });

    if (currentRect) {
      const [x1, y1, x2, y2] = currentRect;
      ctx.strokeStyle = '#f6e05e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  }, [annotations, currentRect]);

  const transformMouse = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const start = transformMouse(event);
    startRef.current = start;
    setDrawing(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!drawing) return;
    const position = transformMouse(event);
    setCurrentRect([startRef.current.x, startRef.current.y, position.x, position.y]);
  };

  const handleMouseUp = () => {
    if (!drawing || !currentRect) {
      setDrawing(false);
      setCurrentRect(null);
      return;
    }

    const [x1, y1, x2, y2] = currentRect;
    if (Math.abs(x2 - x1) < 10 || Math.abs(y2 - y1) < 10) {
      setDrawing(false);
      setCurrentRect(null);
      return;
    }

    onChange([
      ...annotations,
      {
        label: 'Manual annotation',
        bbox: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)],
        author: 'Radiologist',
      },
    ]);
    setDrawing(false);
    setCurrentRect(null);
  };

  return (
    <div className="relative rounded-3xl border border-clinical-panel bg-[#08121b]/90 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-clinical-muted">Annotation Canvas</p>
        <p className="text-xs text-clinical-muted">Draw boxes by dragging on the image</p>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-[#203244] bg-[#09151f]">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Annotation source"
          className="block h-auto max-h-[560px] w-full"
          onLoad={() => {
            const canvas = canvasRef.current;
            const image = imageRef.current;
            if (canvas && image) {
              canvas.width = image.clientWidth;
              canvas.height = image.clientHeight;
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 h-full w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
}
