import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'miniledger_auth_token';
const PHONE_KEY = 'miniledger_auth_phone';

// In-memory fallback
let memoryStore: Record<string, string> = {};

const getWebItem = (key: string): string | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // ignore
    }
  }
  return memoryStore[key] || null;
};

const setWebItem = (key: string, value: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
  memoryStore[key] = value;
};

const removeWebItem = (key: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  delete memoryStore[key];
};

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        setWebItem(TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      setWebItem(TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return getWebItem(TOKEN_KEY);
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return token || getWebItem(TOKEN_KEY);
    } catch {
      return getWebItem(TOKEN_KEY);
    }
  },

  async removeToken(): Promise<void> {
    try {
      removeWebItem(TOKEN_KEY);
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  },

  async setPhone(phone: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        setWebItem(PHONE_KEY, phone);
        return;
      }
      await SecureStore.setItemAsync(PHONE_KEY, phone);
    } catch {
      setWebItem(PHONE_KEY, phone);
    }
  },

  async getPhone(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return getWebItem(PHONE_KEY);
      }
      return (await SecureStore.getItemAsync(PHONE_KEY)) || getWebItem(PHONE_KEY);
    } catch {
      return getWebItem(PHONE_KEY);
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      removeWebItem(PHONE_KEY);
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(PHONE_KEY);
      }
    } catch {
      // ignore
    }
  },
};
