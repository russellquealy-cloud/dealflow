'use client';

import * as React from 'react';
import type { RepairItem, RepairItemStatus } from '@/lib/ai-analyzer-structured';

interface RepairChecklistProps {
  checklist: RepairItem[];
  onChange: (checklist: RepairItem[]) => void;
}

const REPAIR_CATEGORIES = [
  { id: 'roof', label: 'Roof', unitType: 'sqft', defaultQty: 2000 },
  { id: 'hvac', label: 'HVAC System', unitType: 'flat', defaultQty: 1 },
  { id: 'electrical', label: 'Electrical', unitType: 'flat', defaultQty: 1 },
  { id: 'plumbing', label: 'Plumbing', unitType: 'flat', defaultQty: 1 },
  { id: 'windows', label: 'Windows', unitType: 'count', defaultQty: 10 },
  { id: 'doors', label: 'Doors', unitType: 'count', defaultQty: 6 },
  { id: 'kitchen_basic', label: 'Kitchen (Basic)', unitType: 'flat', defaultQty: 1 },
  { id: 'bathroom_full', label: 'Full Bathroom', unitType: 'count', defaultQty: 2 },
  { id: 'bathroom_half', label: 'Half Bathroom', unitType: 'count', defaultQty: 1 },
  { id: 'flooring_lvp', label: 'Flooring (LVP)', unitType: 'sqft', defaultQty: 1500 },
  { id: 'paint_interior', label: 'Interior Paint', unitType: 'sqft', defaultQty: 2000 },
  { id: 'paint_exterior', label: 'Exterior Paint', unitType: 'sqft', defaultQty: 1500 },
  { id: 'drywall', label: 'Drywall Repair', unitType: 'sqft', defaultQty: 200 },
  { id: 'landscaping_light', label: 'Landscaping (Light)', unitType: 'sqft', defaultQty: 500 },
  { id: 'landscaping_medium', label: 'Landscaping (Medium)', unitType: 'sqft', defaultQty: 500 },
  { id: 'landscaping_heavy', label: 'Landscaping (Heavy)', unitType: 'sqft', defaultQty: 500 },
];

const STATUS_OPTIONS: { value: RepairItemStatus; label: string }[] = [
  { value: 'good', label: '✅ Good (No Work)' },
  { value: 'repair', label: '🔧 Repair Needed' },
  { value: 'replace', label: '🔄 Replace' },
  { value: 'unknown', label: '❓ Unknown' },
];

export default function RepairChecklist({ checklist, onChange }: RepairChecklistProps) {
  const addItem = (categoryId: string) => {
    const category = REPAIR_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const newItem: RepairItem = {
      category: categoryId,
      status: 'unknown',
      quantity: category.defaultQty,
      units: category.unitType === 'sqft' ? 'sqft' : category.unitType === 'count' ? 'count' : 'flat',
      notes: '',
    };

    onChange([...checklist, newItem]);
  };

  const updateItem = (index: number, updates: Partial<RepairItem>) => {
    const newChecklist = [...checklist];
    newChecklist[index] = { ...newChecklist[index], ...updates };
    onChange(newChecklist);
  };

  const removeItem = (index: number) => {
    onChange(checklist.filter((_, i) => i !== index));
  };

  const availableCategories = REPAIR_CATEGORIES.filter(
    cat => !checklist.some(item => item.category === cat.id)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Repair Checklist</h3>
        {availableCategories.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value);
                e.target.value = '';
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 14,
              background: 'white',
            }}
            defaultValue=""
          >
            <option value="">+ Add Repair Item</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {checklist.length === 0 ? (
        <div style={{
          padding: 32,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 8,
          color: '#6b7280',
        }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No repair items added yet</div>
          <div style={{ fontSize: 12 }}>Click &quot;+ Add Repair Item&quot; to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {checklist.map((item, index) => {
            const category = REPAIR_CATEGORIES.find(c => c.id === item.category);
            const showQuantity = item.status !== 'good' && item.units !== 'flat';

            return (
              <div
                key={index}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                      {category?.label || item.category}
                    </div>
                    
                    {/* Status */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                        Status:
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => updateItem(index, { status: e.target.value as RepairItemStatus })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          fontSize: 14,
                        }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity (if needed) */}
                    {showQuantity && (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                          Quantity ({item.units}):
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 0 })}
                          min="0"
                          step={item.units === 'sqft' ? '10' : '1'}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            fontSize: 14,
                          }}
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                        Notes (optional):
                      </label>
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, { notes: e.target.value })}
                        placeholder="Add notes about this repair..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          fontSize: 14,
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(index)}
                    style={{
                      marginLeft: 12,
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

