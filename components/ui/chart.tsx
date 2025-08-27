"use client"

import type React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartSeries {
  name: string
  key: string
  color: string
}

interface ChartProps {
  title: string
  description?: string
  data: any[]
  type: "line" | "bar"
  xAxisKey: string
  series: ChartSeries[]
  height?: number
}

export function Chart({ title, description, data, type, xAxisKey, series, height = 300 }: ChartProps) {
  const ChartComponent = type === "line" ? LineChart : BarChart

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey={xAxisKey} className="text-xs fill-gray-600" tick={{ fontSize: 12 }} />
            <YAxis className="text-xs fill-gray-600" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend />
            {series.map((s) =>
              type === "line" ? (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  name={s.name}
                  dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
                />
              ) : (
                <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.name} />
              ),
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Export additional chart components for compatibility
export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-container">{children}</div>
}

export const ChartTooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-tooltip">{children}</div>
}

export const ChartTooltipContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-tooltip-content">{children}</div>
}

export const ChartLegend = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-legend">{children}</div>
}

export const ChartLegendContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-legend-content">{children}</div>
}

export const ChartStyle = () => {
  return null
}
