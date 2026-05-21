/**
 * QuantityMeasurement - AJAX Frontend Authentication Service
 * Manages user sessions via local express server endpoints.
 */

class AuthException extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthException';
    }
}

var API_BASE = window.location.origin && window.location.origin.startsWith('http') 
    ? window.location.origin 
    : 'http://127.0.0.1:3000';

class AuthService {
    // Register a new user
    static register(name, email, password) {
        if (!name || name.trim().length < 2) {
            return Promise.reject(new AuthException('Name must be at least 2 characters long.'));
        }
        if (!email || !email.includes('@')) {
            return Promise.reject(new AuthException('Please provide a valid email address.'));
        }
        if (!password || password.length < 6) {
            return Promise.reject(new AuthException('Password must be at least 6 characters long.'));
        }

        return fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new AuthException(data.message || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(user => {
            localStorage.setItem('qm_current_user', JSON.stringify(user));
            return user;
        });
    }

    // Log in an existing user
    static login(email, password) {
        if (!email || !password) {
            return Promise.reject(new AuthException('Email and password are required.'));
        }

        return fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.trim(), password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new AuthException(data.message || 'Invalid email or password.');
                });
            }
            return response.json();
        })
        .then(user => {
            localStorage.setItem('qm_current_user', JSON.stringify(user));
            return user;
        });
    }

    // Retrieve active logged in user profile
    static getProfile() {
        const user = localStorage.getItem('qm_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Terminate current session
    static logout() {
        localStorage.removeItem('qm_current_user');
    }

    // Check if session exists
    static isAuthenticated() {
        return !!localStorage.getItem('qm_current_user');
    }
}
