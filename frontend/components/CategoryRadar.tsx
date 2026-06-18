"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { CategoryScore } from "@/lib/types";

export function CategoryRadar({
  categories,
}: {
  categories: Record<string, CategoryScore>;
}) {
  const data = Object.values(categories).map((c) => ({
    subject: c.label,
    score: c.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="rgba(255,255,255,0.12)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
        />
        <Radar
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.35}
          isAnimationActive
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
