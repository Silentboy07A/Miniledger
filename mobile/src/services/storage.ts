import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'miniledger_auth_token';
const PHONE_KEY = 'miniledger_auth_phone';

// In-memory fallback for environments where SecureStore is unavailable
let memoryStore: Record<string, string> = {};

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStore[TOKEN_KEY] = token;
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      memoryStore[TOKEN_KEY] = token;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return memoryStore[TOKEN_KEY] || null;
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return token || memoryStore[TOKEN_KEY] || null;
    } catch {
      return memoryStore[TOKEN_KEY] || null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      delete memoryStore[TOKEN_KEY];
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
        memoryStore[PHONE_KEY] = phone;
        return;
      }
      await SecureStore.setItemAsync(PHONE_KEY, phone);
    } catch {
      memoryStore[PHONE_KEY] = phone;
    }
  },

  async getPhone(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return memoryStore[PHONE_KEY] || null;
      }
      return (await SecureStore.getItemAsync(PHONE_KEY)) || memoryStore[PHONE_KEY] || null;
    } catch {
      return memoryStore[PHONE_KEY] || null;
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      delete memoryStore[PHONE_KEY];
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(PHONE_KEY);
      }
    } catch {
      // ignore
    }
  },
};
