'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

// Data shape: { text: 'love', count: 53, sentiment?: number in [-1,1], recentWeight?: number in [0,1] }
export type WordDatum = { text: string; count: number; sentiment?: number; recentWeight?: number };

type Props = {
  title?: string;
  words: WordDatum[];
  minFont?: number;   // px
  maxFont?: number;   // px
  topN?: number;      // show only top-N by count (optional)
  className?: string; // wrapper styles
};

export default function WordCloudCard({
  title = 'Keyword Cloud',
  words,
  minFont = 16,
  maxFont = 72,
  topN,
  className = ''
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [zoomLevel, setZoomLevel] = useState(1.5); // Default to 150% zoom

  // lazy import to avoid SSR crash
  const WordCloudLib = useRef<any>(null);
  useEffect(() => {
    setMounted(true);
    (async () => {
      // @ts-ignore
      WordCloudLib.current = (await import('wordcloud')).default ?? (await import('wordcloud'));
    })();
  }, []);

  // sanitize & rank
  const ranked = useMemo(() => {
    const filtered = words
      .filter(w => w.text?.trim().length > 0)
      .filter(w => {
        const sentiment = w.sentiment ?? 0;
        switch (sentimentFilter) {
          case 'positive':
            return sentiment > 0.05;
          case 'negative':
            return sentiment < -0.05;
          case 'neutral':
            return sentiment >= -0.05 && sentiment <= 0.05;
          case 'all':
          default:
            return true;
        }
      })
      .sort((a, b) => b.count - a.count);

    return typeof topN === 'number' ? filtered.slice(0, topN) : filtered;
  }, [words, topN, sentimentFilter]);

  // scales
  const [minC, maxC] = useMemo(() => {
    const counts = ranked.map(w => w.count);
    return [Math.min(...counts), Math.max(...counts)];
  }, [ranked]);

  const fontScale = (c: number) => {
    if (maxC === minC) return (minFont + maxFont) / 2;
    // Use linear scale for better visibility
    const t = (c - minC) / (maxC - minC);
    return minFont + t * (maxFont - minFont);
  };

  const alphaScale = (w: WordDatum) => {
    // Enhanced transparency for better visibility on dark theme
    const r = w.recentWeight ?? 0.9; // Higher default opacity for better visibility
    return Math.min(1, Math.max(0.6, r)); // Higher minimum opacity for dark backgrounds
  };


  // resize observer to keep canvas crisp
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranked, mounted, sentimentFilter, zoomLevel]);

  const render = () => {
    const WC = WordCloudLib.current;
    if (!mounted || !WC || !canvasRef.current || !containerRef.current || ranked.length === 0) {
      return;
    }

    const el = canvasRef.current;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    // Get container dimensions, accounting for padding
    const containerRect = container.getBoundingClientRect();
    const padding = 32; // Account for padding (p-4 = 16px on each side)
    const w = Math.max(200, containerRect.width - padding);
    const h = Math.max(150, Math.round(w * 0.6)); // Better aspect ratio

    // Set canvas size
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;

    // Prepare word list for wordcloud library with proper font sizes and zoom
    const list: [string, number][] = ranked.map(w => [
      w.text,
      fontScale(w.count) * zoomLevel // Apply zoom to font size
    ]);

    // Clear canvas first
    const ctx = el.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, el.width, el.height);
    }

    try {
      WC(el, {
        list,
        gridSize: Math.round(4 * (w / 400) / zoomLevel), // Adjust grid size for zoom
        weightFactor: (size: number) => size, // Use size directly as font size
        rotateRatio: 0, // No rotation for readability
        backgroundColor: 'transparent',
        shrinkToFit: true,
        drawOutOfBound: false,
        color: (word: string, weight: number, fontSize: number, distance: number, theta: number) => {
          // Find the word data to get sentiment
          const wordData = ranked.find(w => w.text === word);
          if (!wordData) return 'rgba(147, 197, 253, 0.8)'; // blue-300 with transparency
          
          const sentiment = wordData.sentiment ?? 0;
          const alpha = alphaScale(wordData);
          
          // Custom color palette optimized for dark theme
          if (sentiment > 0.05) {
            // Positive sentiment - emerald-400 with green glow
            return `rgba(74, 222, 128, ${alpha})`; // #4ADE80
          } else if (sentiment < -0.05) {
            // Negative sentiment - rose-400 soft red
            return `rgba(251, 113, 133, ${alpha})`; // #FB7185
          } else {
            // Neutral sentiment - blue-300 cool balanced tone
            return `rgba(147, 197, 253, ${alpha})`; // #93C5FD
          }
        },
        classes: 'select-none',
        hover: (item: any, dimension: any, event: MouseEvent) => {
          if (!item || !dimension) return;
          (event?.target as HTMLCanvasElement).title = `${item[0]} — ${item[1]}`;
        }
      });
    } catch (error) {
      console.error('WordCloud render error:', error);
    }
  };

  useEffect(() => { render(); /* eslint-disable-next-line */ }, [ranked, mounted, sentimentFilter, zoomLevel]);

  // Add mouse wheel zoom functionality
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-white/10 bg-neutral-900/40 p-4 shadow-sm ${className}`}
      style={{ minHeight: '200px' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/90">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-white/70">
          {/* Sentiment Filter Dropdown */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value as any)}
            className="bg-neutral-800 border border-white/20 rounded px-2 py-1 text-xs text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>

          {/* Zoom Level Display */}
          <span className="px-2 py-1 text-xs text-white/70" title="Scroll to zoom">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      <div className="relative w-full" style={{ minHeight: '150px' }}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full rounded-lg ring-1 ring-white/5 cursor-zoom-in" 
          style={{ display: 'block' }}
          title="Scroll to zoom in/out"
        />
      </div>
    </div>
  );
}

