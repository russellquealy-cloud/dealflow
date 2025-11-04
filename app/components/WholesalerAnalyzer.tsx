'use client';

import * as React from 'react';
import type { WholesalerQuestionType, WholesalerQuestionInput, AnalysisResult } from '@/lib/ai-analyzer-structured';
import RepairChecklist from './RepairChecklist';

type QuestionOption = {
  value: WholesalerQuestionType;
  label: string;
  description: string;
};

const QUESTION_OPTIONS: QuestionOption[] = [
  {
    value: 'mao_calculation',
    label: 'MAO Calculator',
    description: 'Calculate Maximum Allowable Offer given ARV, repairs, and fees'
  },
  {
    value: 'arv_quick_comps',
    label: 'Quick ARV Estimate',
    description: 'Rapid ARV estimation from comparable sales'
  },
  {
    value: 'repair_estimate',
    label: 'Repair Cost Estimate',
    description: 'Detailed repair estimate from component checklist'
  },
  {
    value: 'wholesale_fee_target',
    label: 'Wholesale Fee Calculator',
    description: 'Calculate optimal wholesale fee for target buyer return'
  },
];

export default function WholesalerAnalyzer() {
  const [questionType, setQuestionType] = React.useState<WholesalerQuestionType>('mao_calculation');
  const [formData, setFormData] = React.useState<Partial<WholesalerQuestionInput>>({});
  const [repairChecklist, setRepairChecklist] = React.useState<WholesalerQuestionInput['repairChecklist']>([]);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateFormData = (key: keyof WholesalerQuestionInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: WholesalerQuestionInput = {
        questionType,
        ...formData,
        ...(questionType === 'repair_estimate' && { repairChecklist }),
      };

      const response = await fetch('/api/analyze-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'wholesaler', input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If API fails, show mock data so user can see the UI
        if (errorData.error?.includes('API') || errorData.error?.includes('key') || response.status === 500) {
          console.warn('API not available, showing mock data');
          setResult(generateMockResult(questionType, formData, repairChecklist));
          setError(null);
          return;
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      // On any error, show mock data so UI is visible
      console.warn('Analysis error, showing mock data:', err);
      setResult(generateMockResult(questionType, formData, repairChecklist));
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const renderInputFields = () => {
    switch (questionType) {
      case 'mao_calculation':
        return (
          <>
            <InputField
              label="ARV ($)"
              type="number"
              value={formData.arv}
              onChange={(v) => updateFormData('arv', Number(v))}
              required
            />
            <InputField
              label="Repairs ($)"
              type="number"
              value={formData.repairs}
              onChange={(v) => updateFormData('repairs', Number(v))}
              required
            />
            <InputField
              label="Target Margin (%)"
              type="number"
              value={formData.targetMargin ? formData.targetMargin * 100 : 20}
              onChange={(v) => updateFormData('targetMargin', Number(v) / 100)}
              step="0.1"
            />
            <InputField
              label="Buyer Closing Cost (%)"
              type="number"
              value={formData.buyerClosing ? formData.buyerClosing * 100 : 2}
              onChange={(v) => updateFormData('buyerClosing', Number(v) / 100)}
              step="0.1"
            />
            <InputField
              label="Monthly Carrying Cost ($)"
              type="number"
              value={formData.carryingCost ?? 500}
              onChange={(v) => updateFormData('carryingCost', Number(v))}
            />
            <InputField
              label="Months to Hold"
              type="number"
              value={formData.monthsHold ?? 3}
              onChange={(v) => updateFormData('monthsHold', Number(v))}
            />
            <InputField
              label="Your Fee ($)"
              type="number"
              value={formData.yourFee ?? 0}
              onChange={(v) => updateFormData('yourFee', Number(v))}
            />
          </>
        );

      case 'arv_quick_comps':
        return (
          <>
            <InputField
              label="Square Feet"
              type="number"
              value={formData.sqft}
              onChange={(v) => updateFormData('sqft', Number(v))}
              required
            />
            <InputField
              label="Beds"
              type="number"
              value={formData.beds}
              onChange={(v) => updateFormData('beds', Number(v))}
            />
            <InputField
              label="Baths"
              type="number"
              value={formData.baths}
              onChange={(v) => updateFormData('baths', Number(v))}
            />
            <InputField
              label="Comps Radius (miles)"
              type="number"
              value={formData.compsRadius ?? 1.0}
              onChange={(v) => updateFormData('compsRadius', Number(v))}
              step="0.1"
            />
            <InputField
              label="Comps Timeframe (±months)"
              type="number"
              value={formData.compsMonths ?? 6}
              onChange={(v) => updateFormData('compsMonths', Number(v))}
            />
          </>
        );

      case 'repair_estimate':
        return (
          <>
            <InputField
              label="County (for regional pricing)"
              type="text"
              value={formData.county ?? ''}
              onChange={(v) => updateFormData('county', v)}
              placeholder="e.g., Miami-Dade"
            />
            <div style={{ marginTop: 16 }}>
              <RepairChecklist
                checklist={repairChecklist || []}
                onChange={setRepairChecklist}
              />
            </div>
          </>
        );

      case 'wholesale_fee_target':
        return (
          <>
            <InputField
              label="ARV ($)"
              type="number"
              value={formData.arv}
              onChange={(v) => updateFormData('arv', Number(v))}
              required
            />
            <InputField
              label="Repairs ($)"
              type="number"
              value={formData.repairs}
              onChange={(v) => updateFormData('repairs', Number(v))}
              required
            />
            <InputField
              label="Target Buyer Return (%)"
              type="number"
              value={formData.targetBuyerReturn}
              onChange={(v) => updateFormData('targetBuyerReturn', Number(v))}
              required
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Wholesaler Deal Analyzer</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Calculate MAO, repairs, and wholesale fees with precision
      </p>

      {/* Question Type Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Analysis Type
        </label>
        <select
          value={questionType}
          onChange={(e) => {
            setQuestionType(e.target.value as WholesalerQuestionType);
            setFormData({});
            setRepairChecklist([]);
            setResult(null);
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        >
          {QUESTION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {QUESTION_OPTIONS.find(o => o.value === questionType)?.description}
        </p>
      </div>

      {/* Input Fields */}
      <div style={{ 
        background: '#f9fafb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        display: 'grid',
        gap: 16,
      }}>
        {renderInputFields()}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: loading ? '#9ca3af' : '#059669',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 24,
        }}
      >
        {loading ? 'Calculating...' : 'Calculate'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Results</h2>
          
          {result.cached && (
            <div style={{ 
              background: '#fef3c7', 
              padding: 8, 
              borderRadius: 6, 
              marginBottom: 16,
              fontSize: 12,
            }}>
              📋 Cached result
            </div>
          )}

          {/* Answer */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
              Result:
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>
              {typeof result.result.answer === 'number'
                ? `$${result.result.answer.toLocaleString()}`
                : String(result.result.answer)
              }
            </div>
          </div>

          {/* Calculations */}
          {result.result.calculations && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Breakdown:
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(result.result.calculations).map(([key, value]) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: 8,
                    background: 'white',
                    borderRadius: 6,
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <strong>
                      {typeof value === 'number' 
                        ? (key.includes('Margin') || key.includes('ROI') || key.includes('Return')
                          ? `${value}%`
                          : `$${value.toLocaleString()}`)
                        : String(value)
                      }
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair Breakdown */}
          {questionType === 'repair_estimate' && result.result.calculations?.breakdown && typeof result.result.calculations.breakdown === 'object' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Repair Breakdown:
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(result.result.calculations.breakdown as unknown as Record<string, number>).map(([category, cost]) => (
                  <div key={category} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: 6,
                    background: 'white',
                    borderRadius: 4,
                    fontSize: 13,
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>
                      {category.replace(/_/g, ' ')}:
                    </span>
                    <strong>${typeof cost === 'number' ? cost.toLocaleString() : '0'}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {result.result.notes && result.result.notes.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Notes:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.result.notes.map((note, i) => (
                  <li key={i} style={{ marginBottom: 4, color: '#374151' }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cost Display */}
          <div style={{ 
            marginTop: 16, 
            paddingTop: 16, 
            borderTop: '1px solid #d1d5db',
            fontSize: 12,
            color: '#6b7280',
          }}>
            Analysis cost: {result.aiCost === 0 ? 'Free (calculation only)' : `$${(result.aiCost / 100).toFixed(2)}`}
          </div>
        </div>
      )}
    </div>
  );
}

function generateMockResult(
  questionType: WholesalerQuestionType, 
  formData: Partial<WholesalerQuestionInput>,
  repairChecklist?: WholesalerQuestionInput['repairChecklist']
): AnalysisResult {
  const arv = formData.arv || 300000;
  // If repairChecklist exists but no repairs value, use a simple estimate based on items
  // Otherwise use formData.repairs or default
  const repairs = formData.repairs || (repairChecklist && repairChecklist.length > 0 
    ? repairChecklist.filter(item => item.status !== 'good').length * 5000 // Rough estimate per item
    : 25000);
  const targetMargin = formData.targetMargin || 20;
  const mao = arv * (1 - targetMargin / 100) - repairs;

  // Create breakdown from repairChecklist (mock estimates)
  const breakdown: Record<string, number> = {};
  if (repairChecklist) {
    repairChecklist.forEach(item => {
      if (item.status !== 'good') {
        // Simple mock estimate: use quantity * a base cost estimate
        const baseEstimate = item.units === 'sqft' ? item.quantity * 5 : 
                            item.units === 'count' ? item.quantity * 500 : 5000;
        breakdown[item.category] = baseEstimate;
      }
    });
  }

  return {
    questionType: questionType,
    result: {
      answer: questionType === 'mao_calculation' 
        ? mao
        : questionType === 'arv_quick_comps'
        ? arv
        : repairs,
      calculations: {
        mao: mao,
        arv: arv,
        repairs: repairs,
        targetMargin: targetMargin,
        wholesaleFee: formData.yourFee || 5000,
        breakdown: breakdown
      },
      notes: [
        'This is a mock analysis. Connect OpenAI API key to get real analysis.',
        `Estimated MAO: $${mao.toLocaleString()}`,
        `Total repair cost: $${repairs.toLocaleString()}`
      ]
    },
    cached: false,
    aiCost: 0,
    timestamp: new Date().toISOString()
  };
}

function InputField({ 
  label, 
  type, 
  value, 
  onChange, 
  required,
  step,
  placeholder,
}: {
  label: string;
  type: string;
  value?: number | string;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        required={required}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          fontSize: 14,
        }}
      />
    </label>
  );
}

