import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.1;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      
      if (!isActive) {
        // Draw flat line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#334155'; // slate-700
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      // Create a waveform based on volume
      // Use volume to control amplitude
      const amplitude = Math.max(10, volume * 300); 

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.05 + time) * 
                  Math.cos(x * 0.02 - time) * 
                  amplitude * 
                  (Math.sin(x / width * Math.PI)); // Envelope to keep edges flat
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#22d3ee'; // cyan-400
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#22d3ee';
      ctx.stroke();
      ctx.shadowBlur = 0;

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [volume, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={120} 
      className="w-full h-32 rounded-xl bg-slate-950 border border-slate-800"
    />
  );
};

export default AudioVisualizer;