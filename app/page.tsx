"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"
import { BarChart3, Target, TrendingUp, Calculator, Users } from "lucide-react"

// Função para calcular coeficiente binomial
function binomialCoeff(n: number, k: number): number {
  if (k > n || k < 0) return 0
  if (k === 0 || k === n) return 1

  let result = 1
  for (let i = 0; i < Math.min(k, n - k); i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return result
}

// Função para calcular probabilidade binomial
function binomialProbability(n: number, k: number, p: number): number {
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
}

// Função para calcular intervalo de confiança
function confidenceInterval(
  p: number,
  n: number,
  confidence: number,
): { lower: number; upper: number; margin: number } {
  const z = confidence === 95 ? 1.96 : confidence === 99 ? 2.576 : 1.645
  const margin = z * Math.sqrt((p * (1 - p)) / n)
  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
    margin: margin,
  }
}

export default function BinomialDistributionInterface() {
  // Estados para parâmetros
  const [n, setN] = useState(48)
  const [p, setP] = useState(0.8)
  const [sampleSize, setSampleSize] = useState(1000)
  const [confidence, setConfidence] = useState(95)

  // Cálculos estatísticos
  const stats = useMemo(() => {
    const mean = n * p
    const variance = n * p * (1 - p)
    const stdDev = Math.sqrt(variance)
    const sampleProportion = mean / n
    const ci = confidenceInterval(sampleProportion, sampleSize, confidence)

    return {
      mean,
      variance,
      stdDev,
      sampleProportion,
      confidenceInterval: ci,
    }
  }, [n, p, sampleSize, confidence])

  // Dados para distribuição binomial
  const distributionData = useMemo(() => {
    const data = []
    const start = Math.max(0, Math.floor(stats.mean - 4 * stats.stdDev))
    const end = Math.min(n, Math.ceil(stats.mean + 4 * stats.stdDev))

    for (let k = start; k <= end; k++) {
      const prob = binomialProbability(n, k, p)
      data.push({
        k,
        probability: prob,
        percentage: prob * 100,
      })
    }
    return data
  }, [n, p, stats.mean, stats.stdDev])

  // Dados para aproximação normal
  const normalData = useMemo(() => {
    const data = []
    const mean = stats.mean
    const stdDev = stats.stdDev

    for (let x = mean - 4 * stdDev; x <= mean + 4 * stdDev; x += 0.1) {
      const z = (x - mean) / stdDev
      const density = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z)
      data.push({
        x: x / n,
        density: density * n * 100,
      })
    }
    return data
  }, [stats.mean, stats.stdDev, n])

  // Cálculos para regiões de confiança
  const { zCritical, standardError, confidenceRegionData, confidenceAreaPercent } = useMemo(() => {
    const alpha = (100 - confidence) / 100
    const zCrit = confidence === 95 ? 1.96 : confidence === 99 ? 2.576 : 1.645
    const stdError = stats.stdDev / Math.sqrt(sampleSize)

    const data = []
    for (let z = -4; z <= 4; z += 0.05) {
      const density = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z)

      data.push({
        z,
        normalDensity: density,
        confidenceArea: z >= -zCrit && z <= zCrit ? density : 0,
        criticalLeft: z < -zCrit ? density : 0,
        criticalRight: z > zCrit ? density : 0,
      })
    }

    return {
      zCritical: zCrit,
      standardError: stdError,
      confidenceRegionData: data,
      confidenceAreaPercent: confidence,
    }
  }, [confidence, stats.stdDev, sampleSize])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header com Parâmetros */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="h-6 w-6 text-gray-700" />
              <h1 className="text-2xl font-semibold text-gray-800">
                Simulador de Amostragem E Distribuição Binomial Estatística
              </h1>
            </div>

            {/* Controles em linha horizontal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Número de Tentativas (n): {n}</Label>
                <Slider
                  value={[n]}
                  onValueChange={(value) => setN(value[0])}
                  max={100}
                  min={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">
                  Probabilidade de Sucesso (p): {p.toFixed(2)}
                </Label>
                <Slider
                  value={[p]}
                  onValueChange={(value) => setP(value[0])}
                  max={1}
                  min={0}
                  step={0.01}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Tamanho da Amostra: {sampleSize}</Label>
                <Slider
                  value={[sampleSize]}
                  onValueChange={(value) => setSampleSize(value[0])}
                  max={5000}
                  min={100}
                  step={100}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Nível de Confiança: {confidence}%</Label>
                <Slider
                  value={[confidence]}
                  onValueChange={(value) => setConfidence(value[0])}
                  max={99}
                  min={90}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Média (μ)</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.mean.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Desvio Padrão (σ)</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.stdDev.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Margem de Erro</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ±{(stats.confidenceInterval.margin * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Tamanho da Amostra</p>
                  <p className="text-3xl font-bold text-gray-900">{sampleSize.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualizações */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">
            <Tabs defaultValue="distribution" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="distribution">Distribuição Binomial</TabsTrigger>
                <TabsTrigger value="normal">Aproximação Normal</TabsTrigger>
                <TabsTrigger value="confidence-regions">Regiões de Confiança</TabsTrigger>
                <TabsTrigger value="analysis">Análise Estatística</TabsTrigger>
              </TabsList>

              <TabsContent value="distribution" className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="k" tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
                      <YAxis
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#e0e0e0" }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(4)}%`, "Probabilidade"]}
                        labelFormatter={(label) => `k = ${label}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="percentage" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <ReferenceLine x={stats.mean} stroke="#ef4444" strokeDasharray="5 5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Fórmula da Distribuição Binomial</h3>

                  <div className="text-center font-mono text-xl text-gray-700 mb-4">
                    P(X = k) = C(n,k) × p^k × (1-p)^(n-k)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Componentes da Fórmula:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                          <strong>P(X = k):</strong> Probabilidade de exatamente k sucessos
                        </li>
                        <li>
                          <strong>C(n,k):</strong> Combinações de n elementos tomados k a k
                        </li>
                        <li>
                          <strong>p^k:</strong> Probabilidade de k sucessos
                        </li>
                        <li>
                          <strong>(1-p)^(n-k):</strong> Probabilidade de (n-k) fracassos
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Aplicação Fundamental:</h4>
                      <p className="text-sm text-gray-600">
                        A distribuição binomial é essencial para modelar experimentos com:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                          • <strong>Ensaios independentes</strong> (cada tentativa não afeta as outras)
                        </li>
                        <li>
                          • <strong>Dois resultados possíveis</strong> (sucesso ou fracasso)
                        </li>
                        <li>
                          • <strong>Probabilidade constante</strong> em todas as tentativas
                        </li>
                        <li>
                          • <strong>Número fixo de tentativas</strong> (n)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Exemplo Atual:</h4>
                    <p className="text-sm text-gray-600">
                      Com n = {n} tentativas e p = {p} de probabilidade de sucesso, a média esperada é μ = np ={" "}
                      {stats.mean.toFixed(2)} sucessos. Esta distribuição é fundamental em controle de qualidade,
                      pesquisas de opinião, testes médicos e análise de confiabilidade.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="normal" className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={normalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="x"
                        tickFormatter={(value) => value.toFixed(2)}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#e0e0e0" }}
                      />
                      <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e0e0e0" }} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(4), "Densidade"]}
                        labelFormatter={(label) => `Proporção: ${Number(label).toFixed(3)}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="density" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <ReferenceLine
                        x={stats.sampleProportion}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label="Proporção Observada"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Aproximação Normal</h3>
                  <p className="text-sm text-gray-600">
                    Para n grande, X ~ Normal(μ = np = {stats.mean.toFixed(2)}, σ = √(np(1-p)) ={" "}
                    {stats.stdDev.toFixed(2)})
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="confidence-regions" className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceRegionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="z"
                        domain={[-4, 4]}
                        type="number"
                        tickFormatter={(value) => value.toFixed(1)}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#e0e0e0" }}
                        label={{ value: "Z-score (Desvios Padrão)", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        domain={[0, 0.45]}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: "#e0e0e0" }}
                        label={{ value: "Densidade de Probabilidade", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value.toFixed(4),
                          name === "normalDensity"
                            ? "Densidade Normal"
                            : name === "confidenceArea"
                              ? "Área de Confiança"
                              : "Região Crítica",
                        ]}
                        labelFormatter={(label) => `Z = ${Number(label).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                        }}
                      />

                      {/* Região Crítica Esquerda */}
                      <Area type="monotone" dataKey="criticalLeft" stroke="none" fill="#ef4444" fillOpacity={0.6} />

                      {/* Área de Confiança */}
                      <Area type="monotone" dataKey="confidenceArea" stroke="none" fill="#10b981" fillOpacity={0.4} />

                      {/* Região Crítica Direita */}
                      <Area type="monotone" dataKey="criticalRight" stroke="none" fill="#ef4444" fillOpacity={0.6} />

                      {/* Curva Normal */}
                      <Area type="monotone" dataKey="normalDensity" stroke="#3b82f6" strokeWidth={2} fill="none" />

                      {/* Linhas Z-críticas */}
                      <ReferenceLine x={-zCritical} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine x={zCritical} stroke="#ef4444" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Distribuição Normal e Regiões de Confiança
                    </h3>
                    <p className="text-gray-600">
                      Z-crítico: ±{zCritical.toFixed(3)} | Erro Padrão: {standardError.toFixed(4)}
                    </p>
                  </div>

                  <div className="flex justify-center gap-8 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-700">Distribuição Normal Padrão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-400 rounded"></div>
                      <span className="text-sm text-gray-700">Área de Confiança (±{zCritical.toFixed(2)} σ)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-400 rounded"></div>
                      <span className="text-sm text-gray-700">Região Crítica</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                      <h4 className="font-semibold text-green-800 mb-2">Área de Confiança</h4>
                      <p className="text-green-700">{confidenceAreaPercent.toFixed(1)}%</p>
                      <p className="text-xs text-green-600 mt-1">
                        Entre Z = -{zCritical.toFixed(2)} e Z = +{zCritical.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg text-center">
                      <h4 className="font-semibold text-red-800 mb-2">Região Crítica</h4>
                      <p className="text-red-700">{(100 - confidenceAreaPercent).toFixed(1)}%</p>
                      <p className="text-xs text-red-600 mt-1">Caudas: |Z| &gt; {zCritical.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg text-center">
                      <h4 className="font-semibold text-blue-800 mb-2">Erro Padrão</h4>
                      <p className="text-blue-700">{standardError.toFixed(4)}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        σ/√n = {stats.stdDev.toFixed(2)}/√{sampleSize}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Intervalo de Confiança</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Proporção da Amostra:</span>
                          <span className="font-semibold">{stats.sampleProportion.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Margem de Erro:</span>
                          <span className="font-semibold">±{(stats.confidenceInterval.margin * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Limite Inferior:</span>
                          <span className="font-semibold">{(stats.confidenceInterval.lower * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Limite Superior:</span>
                          <span className="font-semibold">{(stats.confidenceInterval.upper * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Interpretação</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Confiança:</strong> {confidence}% de que a verdadeira proporção populacional está
                          entre {(stats.confidenceInterval.lower * 100).toFixed(2)}% e{" "}
                          {(stats.confidenceInterval.upper * 100).toFixed(2)}%
                        </p>
                        <p>
                          <strong>Precisão:</strong> Margem de erro de ±
                          {(stats.confidenceInterval.margin * 100).toFixed(2)} pontos percentuais
                        </p>
                        <p>
                          <strong>Amostra:</strong> {sampleSize.toLocaleString()} observações analisadas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Exemplo Prático: Controle de Qualidade</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Em uma linha de produção, testamos {n} produtos e encontramos uma taxa de sucesso de{" "}
                    {(p * 100).toFixed(0)}%. Com base em uma amostra de {sampleSize.toLocaleString()} produtos:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Expectativa</h4>
                      <p className="text-sm text-blue-700">
                        Esperamos {stats.mean.toFixed(0)} sucessos em {n} tentativas
                      </p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Variabilidade</h4>
                      <p className="text-sm text-green-700">Desvio padrão de {stats.stdDev.toFixed(2)} produtos</p>
                    </div>
                    <div className="bg-orange-100 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Confiabilidade</h4>
                      <p className="text-sm text-orange-700">{confidence}% de confiança na estimativa</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
