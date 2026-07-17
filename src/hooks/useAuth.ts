import { useContext } from 'react';
import { AuthContext } from '../context/authContextObject';

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth harus dipanggil di dalam <AuthProvider>. Bungkus App.tsx dengan AuthProvider.');
  }

  return context;
}
