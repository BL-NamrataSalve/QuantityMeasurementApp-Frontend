/**
 * QuantityMeasurement - AJAX Frontend Operations History Logger
 * Manages history records and account statistics via local express server endpoints.
 */

var API_BASE = window.location.origin && window.location.origin.startsWith('http') 
    ? window.location.origin 
    : 'http://127.0.0.1:3000';

class HistoryService {
    // Fetch history records filtered by email and operation type (Returns a Promise)
    static getHistory(userEmail, operationFilter = 'ALL') {
        const emailNormalized = userEmail ? userEmail.toLowerCase() : 'anonymous';
        return fetch(`${API_BASE}/api/history?email=${encodeURIComponent(emailNormalized)}&filter=${encodeURIComponent(operationFilter)}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch history logs');
                return response.json();
            });
    }

    // Append a new history record (Returns a Promise)
    static logOperation({
        userEmail,
        operationType,
        firstQuantityValue,
        firstUnit,
        secondQuantityValue = 0,
        secondUnit = '',
        resultQuantityValue,
        resultUnit
    }) {
        const payload = {
            userEmail,
            operationType,
            firstQuantityValue,
            firstUnit,
            secondQuantityValue,
            secondUnit,
            resultQuantityValue,
            resultUnit
        };
        return fetch(`${API_BASE}/api/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to log operation');
            return response.json();
        });
    }

    // Clear history records for a specific user (Returns a Promise)
    static clearHistory(userEmail) {
        const emailNormalized = userEmail ? userEmail.toLowerCase() : 'anonymous';
        return fetch(`${API_BASE}/api/history?email=${encodeURIComponent(emailNormalized)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to clear operation history');
            return response.json();
        });
    }

    // Get statistics (number of conversions vs other operations) (Returns a Promise)
    static getStats(userEmail) {
        const emailNormalized = userEmail ? userEmail.toLowerCase() : 'anonymous';
        return fetch(`${API_BASE}/api/stats?email=${encodeURIComponent(emailNormalized)}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch stats');
                return response.json();
            });
    }

    // Import operations array (Returns a Promise)
    static importLogs(userEmail, logs) {
        const emailNormalized = userEmail ? userEmail.toLowerCase() : 'anonymous';
        return fetch(`${API_BASE}/api/history/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailNormalized, logs })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to import operation logs');
            return response.json();
        });
    }
}
