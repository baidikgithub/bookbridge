import { Platform } from 'react-native';

// Android emulators reach the host machine at 10.0.2.2; a real device needs your machine's LAN IP.
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});
