"use client";

import React, { useEffect, useState } from "react";

export function SparkBurst({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 550);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20"
      aria-hidden="true"
    >
      <div className="absolute w-2 h-2 rounded-full bg-accent-gold animate-ping" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-accent-magenta -translate-y-4 animate-spark-burst" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-accent-orange translate-x-4 animate-spark-burst" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-accent-cyan translate-y-4 animate-spark-burst" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-accent-lime -translate-x-4 animate-spark-burst" />
    </div>
  );
}
