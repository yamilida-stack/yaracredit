import { useState } from 'react';
import { useStore } from '../store';
import { Card, Badge, Button, Select, formatCurrency } from '../components/ui';
import { Brain, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, Target } from 'lucide-react';

interface RiskScore {
  clientId: string;
  score: number;
  level: 'bajo' | 'medio' | 'alto';
  factors: { name: string; impact: 'positive' | 'negative'; value: string }[];
  recommendation: string;
}

export default function RiskScorePage() {
  const { clients, loans } = useStore();
  const [selectedClient, setSelectedClient] = useState('');
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const calculateRiskScore = (clientId: string): RiskScore => {
    const client = clients.find(c => c.id === clientId);
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeLoans = clientLoans.filter(l => l.status === 'activo');
    const overdueLoans = clientLoans.filter(l => l.status === 'mora');
    const paidLoans = clientLoans.filter(l => l.status === 'cancelado');

    let score = 70; // Base score
    const factors: RiskScore['factors'] = [];

    // Factor 1: Payment history
    if (paidLoans.length > 0) {
      score += 15;
      factors.push({ name: 'Historial de pagos completados', impact: 'positive', value: `${paidLoans.length} préstamos pagados` });
    }

    // Factor 2: Overdue loans
    if (overdueLoans.length > 0) {
      score -= 25 * overdueLoans.length;
      factors.push({ name: 'Préstamos en mora', impact: 'negative', value: `${overdueLoans.length} préstamos vencidos` });
    }

    // Factor 3: Active loans ratio
    if (activeLoans.length > 2) {
      score -= 10;
      factors.push({ name: 'Múltiples préstamos activos', impact: 'negative', value: `${activeLoans.length} préstamos activos` });
    } else if (activeLoans.length === 1) {
      score += 5;
      factors.push({ name: 'Préstamo activo manejable', impact: 'positive', value: '1 préstamo activo' });
    }

    // Factor 4: Guarantor
    if (client?.guarantor) {
      score += 10;
      factors.push({ name: 'Cuenta con garante', impact: 'positive', value: client.guarantor });
    }

    // Factor 5: Income verification
    if (client?.monthlyIncome && client.monthlyIncome > 10000) {
      score += 10;
      factors.push({ name: 'Ingresos verificados', impact: 'positive', value: formatCurrency(client.monthlyIncome) });
    }

    // Factor 6: Client age (time in system)
    const clientAge = Math.floor((Date.now() - new Date(client?.createdAt || '').getTime()) / (1000 * 60 * 60 * 24));
    if (clientAge > 180) {
      score += 10;
      factors.push({ name: 'Cliente antiguo', impact: 'positive', value: `${Math.floor(clientAge / 30)} meses` });
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    let level: RiskScore['level'] = 'medio';
    let recommendation = '';
    if (score >= 80) {
      level = 'bajo';
      recommendation = '✅ Cliente de bajo riesgo. Aprobar préstamo sin restricciones.';
    } else if (score >= 60) {
      level = 'medio';
      recommendation = '⚠️ Cliente de riesgo moderado. Considerar garantías adicionales o monto reducido.';
    } else {
      level = 'alto';
      recommendation = '🚫 Cliente de alto riesgo. No recomendado aprobar nuevo préstamo.';
    }

    return { clientId, score, level, factors, recommendation };
  };

  const handleAnalyze = () => {
    if (!selectedClient) return;
    setAnalyzing(true);
    setTimeout(() => {
      const score = calculateRiskScore(selectedClient);
      setScores([score, ...scores.filter(s => s.clientId !== selectedClient)]);
      setAnalyzing(false);
    }, 1500);
  };

  const handleAnalyzeAll = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const allScores = clients.map(c => calculateRiskScore(c.id));
      setScores(allScores);
      setAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Score de Riesgo con IA</h3>
        </div>
        <Button onClick={handleAnalyzeAll} disabled={analyzing}>
          <Target size={16} /> {analyzing ? 'Analizando...' : 'Analizar Todos'}
        </Button>
      </div>

      {/* Info card */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Brain size={20} className="text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-purple-900">Análisis Predictivo con Inteligencia Artificial</p>
            <p className="text-sm text-purple-700 mt-1">
              Nuestro sistema evalúa el nivel de riesgo de cada cliente antes de aprobar un desembolso,
              analizando historial de pagos, deudas activas, garantías, ingresos y tiempo como cliente.
            </p>
          </div>
        </div>
      </Card>

      {/* Single client analysis */}
      <Card className="p-6">
        <h4 className="font-bold text-gray-900 mb-4">Analizar Cliente Específico</h4>
        <div className="flex gap-3">
          <Select
            options={[
              { value: '', label: 'Seleccionar cliente...' },
              ...clients.map(c => ({ value: c.id, label: `${c.fullName} - ${c.cedula}` }))
            ]}
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
          />
          <Button onClick={handleAnalyze} disabled={!selectedClient || analyzing}>
            <Shield size={16} /> {analyzing ? 'Analizando...' : 'Analizar'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {scores.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900">Resultados del Análisis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scores.map(score => {
              const client = clients.find(c => c.id === score.clientId);
              return (
                <Card key={score.clientId} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h5 className="font-bold text-gray-900">{client?.fullName}</h5>
                      <p className="text-sm text-gray-500">{client?.cedula}</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(score.score)}`}>{score.score}</div>
                      <Badge variant={score.level === 'bajo' ? 'success' : score.level === 'medio' ? 'warning' : 'danger'}>
                        Riesgo {score.level}
                      </Badge>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${getScoreBg(score.score)}`} style={{ width: `${score.score}%` }} />
                    </div>
                  </div>

                  {/* Factors */}
                  <div className="space-y-2 mb-4">
                    {score.factors.map((factor, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {factor.impact === 'positive' ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )}
                        <span className="flex-1">{factor.name}</span>
                        <span className="text-xs text-gray-500">{factor.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className={`p-3 rounded-xl text-sm ${
                    score.level === 'bajo' ? 'bg-green-50 text-green-800' :
                    score.level === 'medio' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-red-50 text-red-800'
                  }`}>
                    {score.recommendation}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {scores.length === 0 && !analyzing && (
        <Card className="p-8 text-center">
          <Brain size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Selecciona un cliente o analiza todos para ver el score de riesgo</p>
        </Card>
      )}

      {analyzing && (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Analizando con IA...</p>
          <p className="text-sm text-gray-400">Evaluando historial, pagos, garantías y más factores</p>
        </Card>
      )}
    </div>
  );
}
