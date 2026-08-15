// AWS Configuration - Will be populated after Terraform apply
const config = {
  // These values come from Terraform outputs
  // For local development, update these manually or use .env
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'ap-south-1',

  // Feature flags
  USE_MOCK_DATA: !import.meta.env.VITE_API_URL, // Use mock data if no API URL
};

export default config;
