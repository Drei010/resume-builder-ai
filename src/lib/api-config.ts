// API Configuration
// Uses environment variables for different deployment environments

const getApiUrl = (): string => {
  // In production (Vercel), use relative paths
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    return "/api/generate-resume";
  }

  // In development, use localhost
  return "http://localhost:3001/api/generate-resume";
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  generateResume: API_BASE_URL,
};
