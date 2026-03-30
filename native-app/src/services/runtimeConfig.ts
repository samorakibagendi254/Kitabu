import { Platform } from 'react-native';

function readProcessEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name];
}

export function getKitabuApiBaseUrl() {
  const configured =
    readProcessEnv('KITABU_API_BASE_URL') ||
    readProcessEnv('KITABU_AI_PROXY_URL') ||
    readProcessEnv('AI_PROXY_URL');

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (__DEV__) {
    // Keep local emulator/simulator auth working in development.
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }

  throw new Error('KITABU_API_BASE_URL must be configured for release builds');
}
