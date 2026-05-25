import React, { useState, useEffect, useRef } from 'react';
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

export default function Converter({ category, token, onOperationCompleted }) {
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prevArgs = useRef({ category, value: '', fromUnit: '', targetUnit: '' });

  // Update default units when category changes
  useEffect(() => {
    const list = UNITS[category] || [];
    if (list.length >= 2) {
      setFromUnit(list[0]);
      setTargetUnit(list[1]);
      setResult(null);
      setError('');
    }
  }, [category]);

  // Perform dynamic conversion
  useEffect(() => {
    if (!fromUnit || !targetUnit || value === '' || isNaN(value)) {
      return;
    }
    // Simple debounce/dedup check
    const currentArgs = { category, value, fromUnit, targetUnit };
    if (JSON.stringify(prevArgs.current) === JSON.stringify(currentArgs)) {
      return;
    }
    prevArgs.current = currentArgs;

    const timer = setTimeout(() => {
      handleConvert();
    }, 400);

    return () => clearTimeout(timer);
  }, [value, fromUnit, targetUnit, category]);

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const valNum = parseFloat(value);
    if (isNaN(valNum)) {
      setError('Please enter a valid number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/conversion/api/v1/quantities/convert',
        {
          value: valNum,
          unit: fromUnit,
          targetUnit: targetUnit
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResult(response.data);
      if (onOperationCompleted) {
        onOperationCompleted();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to perform conversion. Please check your connection.');
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const list = UNITS[category] || [];

  return (
    <div className="glass-panel animated-fadeIn" style={{ flex: 1 }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'left', color: 'var(--text-primary)' }}>
        Unit Converter
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleConvert}>
        <div className="op-form-grid">
          <div className="form-group">
            <label className="form-label">Value to Convert</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 10"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-control"
              value={category}
              disabled
              style={{ opacity: 0.6, textTransform: 'capitalize' }}
            />
          </div>
        </div>

        <div className="op-form-grid">
          <div className="form-group">
            <label className="form-label">From Unit</label>
            <select
              className="custom-select"
              style={{ width: '100%' }}
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              disabled={loading}
            >
              {list.map(u => (
                <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">To Unit</label>
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
        </div>

        <button
          type="submit"
          className="btn btn-secondary btn-full"
          style={{ marginBottom: '10px' }}
          disabled={loading || list.length === 0}
        >
          {loading && <span className="spinner"></span>}
          Convert Now
        </button>
      </form>

      <div className="result-showcase">
        {result !== null ? (
          <div>
            <div className="result-value-big">
              {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
            </div>
            <div className="result-formula">
              {value} {UNIT_LABELS[fromUnit] || fromUnit} = {result.value.toFixed(4).replace(/\.?0+$/, '')} {UNIT_LABELS[result.unit] || result.unit}
            </div>
          </div>
        ) : (
          <span className="result-placeholder">
            Enter a value and select units to convert
          </span>
        )}
      </div>
    </div>
  );
}
