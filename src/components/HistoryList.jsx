import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UNIT_LABELS = {
  FEET: 'ft',
  INCH: 'in',
  YARD: 'yd',
  CENTIMETER: 'cm',
  MILLILITRE: 'ml',
  LITRE: 'l',
  GALLON: 'gal',
  GRAM: 'g',
  KILOGRAM: 'kg',
  TONNE: 't',
  CELSIUS: '°C',
  FAHRENHEIT: '°F',
  DIVISOR: ''
};

export default function HistoryList({ token, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [filter, refreshTrigger]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    
    let url = '/conversion/api/v1/quantities/history';
    if (filter !== 'ALL') {
      url = `/conversion/api/v1/quantities/history/${filter.toLowerCase()}`;
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Sort history descending by ID or createdAt if possible
      const data = Array.isArray(response.data) ? response.data : [];
      data.sort((a, b) => (b.id || 0) - (a.id || 0));
      setHistory(data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please re-login.');
      } else {
        setError('Failed to load operation history logs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return isoString.slice(0, 16).replace('T', ' ');
    }
  };

  const renderBadge = (opType) => {
    const cls = `badge badge-${opType.toLowerCase()}`;
    return <span className={cls}>{opType}</span>;
  };

  const renderDetail = (row) => {
    const { firstQuantityValue, firstUnit, secondQuantityValue, secondUnit, operationType } = row;
    const u1 = UNIT_LABELS[firstUnit] || firstUnit;
    const u2 = UNIT_LABELS[secondUnit] || secondUnit;
    
    const v1 = firstQuantityValue.toFixed(2).replace(/\.?0+$/, '');
    const v2 = secondQuantityValue.toFixed(2).replace(/\.?0+$/, '');

    switch (operationType) {
      case 'CONVERSION':
        return `${v1} ${u1} ➔ Target Unit`;
      case 'ADDITION':
        return `${v1} ${u1} + ${v2} ${u2}`;
      case 'SUBTRACTION':
        return `${v1} ${u1} - ${v2} ${u2}`;
      case 'DIVISION':
        return `${v1} ${u1} / ${v2}`;
      case 'COMPARISON':
        return `${v1} ${u1} =? ${v2} ${u2}`;
      default:
        return `${v1} ${u1} | ${v2} ${u2}`;
    }
  };

  const renderResult = (row) => {
    const { resultQuantityValue, resultUnit, operationType } = row;
    if (operationType === 'COMPARISON') {
      return resultUnit === 'EQUAL' ? 'Equal' : 'Not Equal';
    }
    const val = resultQuantityValue.toFixed(4).replace(/\.?0+$/, '');
    const unit = UNIT_LABELS[resultUnit] || resultUnit;
    return `${val} ${unit}`;
  };

  return (
    <div className="glass-panel history-section animated-fadeIn">
      <div className="history-header">
        <div className="history-title-group">
          <h3 className="history-title">Operation History</h3>
          <p className="history-subtitle">Showing recent conversion and calculation logs</p>
        </div>
        
        <div className="history-actions">
          {loading && <span className="spinner" style={{ margin: 0 }}></span>}
          <select 
            className="custom-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            disabled={loading}
          >
            <option value="ALL">All Operations</option>
            <option value="CONVERSION">Conversions</option>
            <option value="ADDITION">Additions</option>
            <option value="SUBTRACTION">Subtractions</option>
            <option value="DIVISION">Divisions</option>
            <option value="COMPARISON">Comparisons</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operation</th>
              <th>Expression</th>
              <th>Calculated Result</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((row) => (
                <tr key={row.id || Math.random()}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatTimestamp(row.createdAt)}
                  </td>
                  <td>{renderBadge(row.operationType)}</td>
                  <td style={{ fontWeight: '500' }}>{renderDetail(row)}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                    {renderResult(row)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="table-empty">
                  {loading ? 'Fetching history log...' : 'No operation records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
