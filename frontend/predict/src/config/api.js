const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    return `http://${window.location.hostname}:5000`;
};

export const API_BASE_URL = getApiBaseUrl();
