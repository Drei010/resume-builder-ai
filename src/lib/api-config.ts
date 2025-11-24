// API Configuration
// Uses environment variables for different deployment environments

const getApiUrl = (): string => {
  // In development on localhost, use relative path to work with vite dev server proxy
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "/api/generate-resume";
  }

  // In production (Vercel and other hosts), use relative path
  return "/api/generate-resume";
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  generateResume: API_BASE_URL,
};
