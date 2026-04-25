const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    return 'https://health-predictor-71lw.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();
