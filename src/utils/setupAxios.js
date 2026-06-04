import axios from 'axios';
import { logger } from './logger';

export const setupAxios = () => {
    // Interceptor for logging requests and setting Authorization header
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            logger.debug(`Sending ${config.method.toUpperCase()} request to ${config.url}`);
            return config;
        },
        (error) => {
            logger.error(`Request error: ${error.message}`);
            return Promise.reject(error);
        }
    );

    // Interceptor for responses and token refresh
    axios.interceptors.response.use(
        (response) => {
            logger.debug(`Received successful response from ${response.config.url}`);
            return response;
        },
        async (error) => {
            const originalRequest = error.config;
            
            if (error.response) {
                logger.error(`Response error from ${originalRequest.url}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                
                // Show generic error or validation errors if not handled specifically in components
                // (We could add toast notification here)

                // Handle 401 Unauthorized for token refresh
                if (error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (refreshToken) {
                            logger.info('Attempting to refresh access token...');
                            // Call refresh endpoint
                            const res = await axios.post('/auth/api/v1/auth/refresh', {
                                refreshToken: refreshToken
                            });
                            
                            const newAccessToken = res.data.token;
                            const newRefreshToken = res.data.refreshToken;
                            
                            // Update storage
                            localStorage.setItem('token', newAccessToken);
                            localStorage.setItem('refreshToken', newRefreshToken);
                            
                            logger.info('Successfully refreshed tokens');
                            
                            // Update auth header for the failed request and retry
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        logger.error('Failed to refresh token. Logging out...', refreshError);
                        // Trigger logout flow (e.g. clear storage and redirect)
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        window.location.href = '/'; // Reload to prompt login
                    }
                }
            } else {
                logger.error(`Network or unexpected error: ${error.message}`);
            }

            return Promise.reject(error);
        }
    );
};
