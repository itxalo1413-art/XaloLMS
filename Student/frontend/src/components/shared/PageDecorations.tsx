"use client";

import * as React from "react";

export const DECOR_IMAGES = [
  "/el1.png",
  "/el2.png",
  "/el3.png",
  "/el4.png",
  "/el5.png",
  "/el6.png",
  "/el7.png",
  "/el8.png",
] as const;

const DECOR_SLOTS = [
  "-top-2 left-[6px] w-12 md:w-16 opacity-35",
  "top-20 right-[8px] w-12 md:w-16 opacity-35",
  "top-[36%] right-[4px] w-10 md:w-14 opacity-30",
  "top-[56%] left-[8px] w-10 md:w-14 opacity-30",
  "bottom-20 right-[6px] w-12 md:w-16 opacity-35",
  "bottom-10 left-[10px] w-10 md:w-14 opacity-30",
] as const;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Props = {
  seed?: string;
};

export function PageDecorations({ seed = "/" }: Props) {
  const decorItems = React.useMemo(() => {
    const hash = hashString(seed);
    return DECOR_SLOTS.map((slot, idx) => {
      const image = DECOR_IMAGES[(hash + idx * 3) % DECOR_IMAGES.length];
      return { slot, image, key: `${idx}-${image}` };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden md:block">
      {decorItems.map((item) => (
        <img
          key={item.key}
          src={item.image}
          alt=""
          role="presentation"
          className={`absolute select-none object-contain ${item.slot}`}
        />
      ))}
    </div>
  );
}
