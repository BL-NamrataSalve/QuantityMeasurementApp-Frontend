import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UNITS = {
  LENGTH: ['FEET', 'INCH', 'YARD', 'CENTIMETER'],
  VOLUME: ['MILLILITRE', 'LITRE', 'GALLON'],
  WEIGHT: ['GRAM', 'KILOGRAM', 'TONNE'],
  TEMPERATURE: ['CELSIUS', 'FAHRENHEIT']
};

const UNIT_LABELS = {
  FEET: 'Feet (ft)',
  INCH: 'Inch (in)',
  YARD: 'Yard (yd)',
  CENTIMETER: 'Centimeter (cm)',
  MILLILITRE: 'Millilitre (ml)',
  LITRE: 'Litre (l)',
  GALLON: 'Gallon (gal)',
  GRAM: 'Gram (g)',
  KILOGRAM: 'Kilogram (kg)',
  TONNE: 'Tonne (t)',
  CELSIUS: 'Celsius (°C)',
  FAHRENHEIT: 'Fahrenheit (°F)'
};

export default function Calculator({ category, token, onOperationCompleted }) {
  const [operator, setOperator] = useState('ADD'); // ADD, SUBTRACT, DIVIDE, COMPARE
  const [firstValue, setFirstValue] = useState('10');
  const [firstUnit, setFirstUnit] = useState('');
  const [secondValue, setSecondValue] = useState('2');
  const [secondUnit, setSecondUnit] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [divisor, setDivisor] = useState('2');
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Update default units when category changes
  useEffect(() => {
    const list = UNITS[category] || [];
    if (list.length >= 2) {
      setFirstUnit(list[0]);
      setSecondUnit(list[1]);
      setTargetUnit(list[0]);
      setResult(null);
      setError('');
    } else if (list.length === 1) {
      setFirstUnit(list[0]);
      setSecondUnit(list[0]);
      setTargetUnit(list[0]);
      setResult(null);
      setError('');
    }
  }, [category]);

  // Clear result when operator changes
  useEffect(() => {
    setResult(null);
    setError('');
  }, [operator]);

  if (category === 'TEMPERATURE') {
    return (
      <div className="glass-panel animated-fadeIn" style={{ flex: 1 }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'left', color: 'var(--text-primary)' }}>
          Arithmetic & Comparison
        </h2>
        <div className="result-showcase" style={{ borderStyle: 'solid', borderColor: 'var(--panel-border)' }}>
          <p className="result-placeholder" style={{ color: 'var(--color-danger)' }}>
            ⚠️ Arithmetic operations and comparisons are not supported for Temperature.
          </p>
        </div>
      </div>
    );
  }

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const val1Num = parseFloat(firstValue);
    if (isNaN(val1Num)) {
      setError('Please enter a valid first value');
      return;
    }

    let payload = {};
    let url = '';

    if (operator === 'ADD' || operator === 'SUBTRACT') {
      const val2Num = parseFloat(secondValue);
      if (isNaN(val2Num)) {
        setError('Please enter a valid second value');
        return;
      }
      url = operator === 'ADD' ? '/conversion/api/v1/quantities/add' : '/conversion/api/v1/quantities/subtract';
      payload = {
        firstValue: val1Num,
        firstUnit: firstUnit,
        secondValue: val2Num,
        secondUnit: secondUnit,
        targetUnit: targetUnit
      };
    } else if (operator === 'COMPARE') {
      const val2Num = parseFloat(secondValue);
      if (isNaN(val2Num)) {
        setError('Please enter a valid second value');
        return;
      }
      url = '/conversion/api/v1/quantities/compare';
      payload = {
        firstValue: val1Num,
        firstUnit: firstUnit,
        secondValue: val2Num,
        secondUnit: secondUnit
      };
    } else if (operator === 'DIVIDE') {
      const divNum = parseFloat(divisor);
      if (isNaN(divNum)) {
        setError('Please enter a valid divisor');
        return;
      }
      if (divNum === 0) {
        setError('Division by zero is not allowed');
        return;
      }
      url = '/conversion/api/v1/quantities/divide';
      payload = {
        firstValue: val1Num,
        firstUnit: firstUnit,
        divisor: divNum,
        secondUnit: secondUnit
      };
    }

    setLoading(true);
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (operator === 'DIVIDE') {
        // Divide returns double directly
        setResult({
          value: response.data,
          unit: firstUnit,
          type: 'DIVISION'
        });
      } else if (operator === 'COMPARE') {
        // Compare returns quantity response dto
        setResult({
          value: response.data.value,
          unit: response.data.unit, // "EQUAL" or "NOT_EQUAL"
          type: 'COMPARISON'
        });
      } else {
        // Add/Subtract returns quantity response dto
        setResult({
          value: response.data.value,
          unit: response.data.unit,
          type: operator
        });
      }

      if (onOperationCompleted) {
        onOperationCompleted();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to perform operation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const list = UNITS[category] || [];

  return (
    <div className="glass-panel animated-fadeIn" style={{ flex: 1 }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'left', color: 'var(--text-primary)' }}>
        Arithmetic & Comparison
      </h2>

      <div className="operator-toggle-group">
        <button 
          className={`operator-toggle-btn ${operator === 'ADD' ? 'active' : ''}`}
          onClick={() => setOperator('ADD')}
          type="button"
        >
          Add (+)
        </button>
        <button 
          className={`operator-toggle-btn ${operator === 'SUBTRACT' ? 'active' : ''}`}
          onClick={() => setOperator('SUBTRACT')}
          type="button"
        >
          Subtract (-)
        </button>
        <button 
          className={`operator-toggle-btn ${operator === 'DIVIDE' ? 'active' : ''}`}
          onClick={() => setOperator('DIVIDE')}
          type="button"
        >
          Divide (/)
        </button>
        <button 
          className={`operator-toggle-btn ${operator === 'COMPARE' ? 'active' : ''}`}
          onClick={() => setOperator('COMPARE')}
          type="button"
        >
          Compare (=)
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleCalculate}>
        <div className="op-form-grid">
          <div className="form-group">
            <label className="form-label">First Value</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={firstValue}
              onChange={(e) => setFirstValue(e.target.value)}
              placeholder="e.g. 10"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">First Unit</label>
            <select
              className="custom-select"
              style={{ width: '100%' }}
              value={firstUnit}
              onChange={(e) => setFirstUnit(e.target.value)}
              disabled={loading}
            >
              {list.map(u => (
                <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
              ))}
            </select>
          </div>
        </div>

        {operator !== 'DIVIDE' ? (
          <div className="op-form-grid">
            <div className="form-group">
              <label className="form-label">Second Value</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={secondValue}
                onChange={(e) => setSecondValue(e.target.value)}
                placeholder="e.g. 5"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Second Unit</label>
              <select
                className="custom-select"
                style={{ width: '100%' }}
                value={secondUnit}
                onChange={(e) => setSecondUnit(e.target.value)}
                disabled={loading}
              >
                {list.map(u => (
                  <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="op-form-grid">
            <div className="form-group">
              <label className="form-label">Divisor</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={divisor}
                onChange={(e) => setDivisor(e.target.value)}
                placeholder="e.g. 2"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Divisor Unit</label>
              <select
                className="custom-select"
                style={{ width: '100%' }}
                value={secondUnit}
                onChange={(e) => setSecondUnit(e.target.value)}
                disabled={loading}
              >
                {list.map(u => (
                  <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(operator === 'ADD' || operator === 'SUBTRACT') && (
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Result Target Unit</label>
            <select
              className="custom-select"
              style={{ width: '100%' }}
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              disabled={loading}
            >
              {list.map(u => (
                <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-secondary btn-full"
          style={{ marginBottom: '10px' }}
          disabled={loading}
        >
          {loading && <span className="spinner"></span>}
          Calculate
        </button>
      </form>

      <div className="result-showcase">
        {result !== null ? (
          <div>
            {result.type === 'COMPARISON' ? (
              <div>
                <div 
                  className="result-value-big"
                  style={{ color: result.unit === 'EQUAL' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {result.unit === 'EQUAL' ? 'Equal (Matches)' : 'Not Equal (Mismatch)'}
                </div>
                <div className="result-formula">
                  {firstValue} {UNIT_LABELS[firstUnit] || firstUnit} {result.unit === 'EQUAL' ? '=' : '≠'} {secondValue} {UNIT_LABELS[secondUnit] || secondUnit}
                </div>
              </div>
            ) : result.type === 'DIVISION' ? (
              <div>
                <div className="result-value-big">
                  {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
                </div>
                <div className="result-formula">
                  {firstValue} {UNIT_LABELS[firstUnit] || firstUnit} / {divisor} = {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
                </div>
              </div>
            ) : (
              <div>
                <div className="result-value-big">
                  {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
                </div>
                <div className="result-formula">
                  {firstValue} {UNIT_LABELS[firstUnit] || firstUnit} {result.type === 'ADD' ? '+' : '-'} {secondValue} {UNIT_LABELS[secondUnit] || secondUnit} = {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="result-placeholder">
            Enter values and select units to calculate
          </span>
        )}
      </div>
    </div>
  );
}
