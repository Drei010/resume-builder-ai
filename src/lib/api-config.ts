// API Configuration
// Uses environment variables for different deployment environments

const getApiBaseUrl = (): string => {
  // In development on localhost, use relative path to work with vite dev server proxy
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "/api";
  }

  // In production (Vercel and other hosts), use relative path
  return "/api";
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  generateResume: `${API_BASE_URL}/generate-resume`,
  extractJob: `${API_BASE_URL}/extract-job`,
  optimizeResume: `${API_BASE_URL}/optimize-resume`,
  tailorResume: `${API_BASE_URL}/tailor-resume`,
};
