"use client";

import { useState } from "react";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatearCOP } from "@/lib/domain/moneda";
import type { PeriodoId, PeriodoMetricas } from "@/lib/domain/tipos";

const PERIODOS: PeriodoId[] = ["hoy", "semana", "mes", "anio"];

const configGrafica = {
  total: { label: "Ventas", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PanelMetricas({ metricas }: { metricas: PeriodoMetricas[] }) {
  const [periodo, setPeriodo] = useState<PeriodoId>("hoy");
  const actual = metricas.find((m) => m.id === periodo) ?? metricas[0];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium">Ventas por período</h2>
        <Tabs value={periodo} onValueChange={(valor) => setPeriodo(valor as PeriodoId)}>
          <TabsList>
            {PERIODOS.map((id) => (
              <TabsTrigger key={id} value={id}>
                {metricas.find((m) => m.id === id)?.etiqueta ?? id}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-muted-foreground text-sm font-medium">Total vendido — {actual.etiqueta}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-semibold tabular-nums">{formatearCOP(actual.totalVendido)}</p>
            <p className="text-muted-foreground text-sm">
              {actual.numeroVentas} {actual.numeroVentas === 1 ? "venta" : "ventas"}
            </p>
          </div>
          {actual.numeroVentas === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Sin ventas en este período</EmptyTitle>
                <EmptyDescription>Cuando registres ventas, verás aquí la tendencia.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ChartContainer config={configGrafica} className="h-56 w-full">
              <BarChart accessibilityLayer data={actual.serie}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={1} tick={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(valor) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">Ventas</span>
                          <span className="font-mono font-medium tabular-nums">{formatearCOP(Number(valor))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
