import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  src: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<Props> = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialDist = useRef(0);
  const startScale = useRef(1);

  useEffect(() => {
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDist.current = Math.hypot(dx, dy);
      startScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    if (e.touches.length === 1 && isDragging.current) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      
      if (initialDist.current > 0) {
        const newScale = Math.max(0.5, Math.min(5, startScale.current * (dist / initialDist.current)));
        setScale(newScale);
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    setScale(prev => Math.max(0.5, Math.min(5, prev + direction * zoomFactor)));
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      ref={containerRef}
    >
      
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Rotate 90°"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0}); setRotation(0); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m0 0V4m0 4h4" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="bg-rose-500/80 hover:bg-rose-500 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
  

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 z-10">
         <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.2)); }} className="text-white p-2 hover:bg-white/10 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
         </button>
         <span className="text-xs font-bold text-slate-300 w-12 text-center">{Math.round(scale * 100)}%</span>
         <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(5, s + 0.2)); }} className="text-white p-2 hover:bg-white/10 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
         </button>
      </div>

      <img 
        src={src} 
        alt="Full screen view" 
        className="max-w-none max-h-none select-none transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`, 
          transition: isDragging.current ? "none" : "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          cursor: isDragging.current ? 'grabbing' : 'grab',
          willChange: 'transform'
        }}
        draggable={false}
      />
    </div>
  );
};
