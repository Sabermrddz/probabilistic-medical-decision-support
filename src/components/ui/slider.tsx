"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
}

export function Slider({ value, min, max, step, onChange, label }: Props) {
  return (
    <SliderPrimitive.Root
      className="relative flex h-5 w-full touch-none select-none items-center"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        className="block h-5 w-5 cursor-grab rounded-full border-2 border-accent bg-card-solid shadow focus-visible:outline-2"
      />
    </SliderPrimitive.Root>
  );
}
