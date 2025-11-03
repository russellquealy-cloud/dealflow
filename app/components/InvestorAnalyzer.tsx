'use client';

import * as React from 'react';
import type { InvestorQuestionType, InvestorQuestionInput, AnalysisResult } from '@/lib/ai-analyzer-structured';

type QuestionOption = {
  value: InvestorQuestionType;
  label: string;
  description: string;
};

const QUESTION_OPTIONS: QuestionOption[] = [
  {
    value: 'deal_at_price',
    label: 'Is this a deal at $X?',
    description: 'Calculate ROI and determine if property is a good investment'
  },
  {
    value: 'price_for_roi',
    label: 'What price hits Y% return?',
    description: 'Find the maximum purchase price to achieve target ROI'
  },
  {
    value: 'arv_from_comps',
    label: 'ARV from comps',
    description: 'Estimate ARV from comparable sales within radius and timeframe'
  },
  {
    value: 'sensitivity_analysis',
    label: 'Sensitivity analysis',
    description: 'See how ARV and repair variations affect deal viability'
  },
  {
    value: 'exit_strategy',
    label: 'Exit strategy comparison',
    description: 'Compare flip, wholetail, and wholesale exit strategies'
  },
];

export default function InvestorAnalyzer() {
  const [questionType, setQuestionType] = React.useState<InvestorQuestionType>('deal_at_price');
  const [formData, setFormData] = React.useState<Partial<InvestorQuestionInput>>({});
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateFormData = (key: keyof InvestorQuestionInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: InvestorQuestionInput = {
        questionType,
        ...formData,
      };

      const response = await fetch('/api/analyze-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'investor', input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If API fails, show mock data so user can see the UI
        if (errorData.error?.includes('API') || errorData.error?.includes('key') || response.status === 500) {
          console.warn('API not available, showing mock data');
          setResult(generateMockResult(questionType, formData));
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
      setResult(generateMockResult(questionType, formData));
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const renderInputFields = () => {
    switch (questionType) {
      case 'deal_at_price':
        return (
          <>
            <InputField
              label="Purchase Price ($)"
              type="number"
              value={formData.purchasePrice}
              onChange={(v) => updateFormData('purchasePrice', Number(v))}
              required
            />
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
          </>
        );

      case 'price_for_roi':
        return (
          <>
            <InputField
              label="Target ROI (%)"
              type="number"
              value={formData.targetROI}
              onChange={(v) => updateFormData('targetROI', Number(v))}
              required
            />
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
          </>
        );

      case 'arv_from_comps':
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

      case 'sensitivity_analysis':
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
              label="Purchase Price ($)"
              type="number"
              value={formData.purchasePrice}
              onChange={(v) => updateFormData('purchasePrice', Number(v))}
              required
            />
            <InputField
              label="ARV Variation (%)"
              type="number"
              value={formData.arvVariation ?? 5}
              onChange={(v) => updateFormData('arvVariation', Number(v))}
            />
            <InputField
              label="Repairs Variation (%)"
              type="number"
              value={formData.repairsVariation ?? 10}
              onChange={(v) => updateFormData('repairsVariation', Number(v))}
            />
          </>
        );

      case 'exit_strategy':
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
              label="Purchase Price ($)"
              type="number"
              value={formData.purchasePrice}
              onChange={(v) => updateFormData('purchasePrice', Number(v))}
              required
            />
            <InputField
              label="Repairs ($)"
              type="number"
              value={formData.repairs}
              onChange={(v) => updateFormData('repairs', Number(v))}
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
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Investor Property Analyzer</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Analyze real estate deals with structured, cost-effective analysis tools
      </p>

      {/* Question Type Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Analysis Type
        </label>
        <select
          value={questionType}
          onChange={(e) => {
            setQuestionType(e.target.value as InvestorQuestionType);
            setFormData({});
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
          background: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 24,
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Deal'}
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
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Analysis Results</h2>
          
          {result.cached && (
            <div style={{ 
              background: '#fef3c7', 
              padding: 8, 
              borderRadius: 6, 
              marginBottom: 16,
              fontSize: 12,
            }}>
              📋 Cached result (from {new Date(result.timestamp).toLocaleTimeString()})
            </div>
          )}

          {/* Answer */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
              Answer:
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>
              {typeof result.result.answer === 'boolean' 
                ? result.result.answer ? '✅ Yes, this is a deal!' : '❌ Not a good deal'
                : typeof result.result.answer === 'number'
                ? `$${result.result.answer.toLocaleString()}`
                : String(result.result.answer)
              }
            </div>
          </div>

          {/* Calculations */}
          {result.result.calculations && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Calculations:
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
                    <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <strong>
                      {typeof value === 'number' 
                        ? (value > 1000 ? `$${value.toLocaleString()}` : `${value}%`)
                        : String(value)
                      }
                    </strong>
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

function generateMockResult(questionType: InvestorQuestionType, formData: Partial<InvestorQuestionInput>): AnalysisResult {
  const purchasePrice = formData.purchasePrice || 200000;
  const arv = formData.arv || 300000;
  const repairs = formData.repairs || 25000;
  const spread = arv - purchasePrice - repairs;

  return {
    questionType: questionType,
    result: {
      answer: questionType === 'deal_at_price' 
        ? spread > 0 
        : questionType === 'price_for_roi'
        ? purchasePrice * 0.85
        : arv,
      calculations: {
        spread: spread,
        roi: purchasePrice > 0 ? ((spread / purchasePrice) * 100) : 0,
        arv: arv,
        repairs: repairs,
        purchasePrice: purchasePrice
      },
      notes: [
        'This is a mock analysis. Connect OpenAI API key to get real analysis.',
        `Estimated spread: $${spread.toLocaleString()}`,
        `Estimated ROI: ${purchasePrice > 0 ? ((spread / purchasePrice) * 100).toFixed(1) : 0}%`
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
}: {
  label: string;
  type: string;
  value?: number;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
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

