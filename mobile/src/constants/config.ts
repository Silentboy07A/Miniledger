import { Platform } from 'react-native';

/**
 * MiniLedger API Configuration
 * 
 * Instructions:
 * - Android Emulator: Uses http://10.0.2.2:3000 by default (maps to host localhost)
 * - iOS Simulator / Web: Uses http://localhost:3000
 * - Physical Device (Expo Go): Replace with your development machine's local IP (e.g., http://192.168.1.15:3000)
 */
const getDefaultApiUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const API_CONFIG = {
  BASE_URL: getDefaultApiUrl(),
  TIMEOUT_MS: 10000,
  MOCK_OTP_FALLBACK_INFO: 'For this assignment, the backend prints the generated 6-digit OTP in its terminal/console.',
};
