declare module '@react-oauth/google' {
  import { ReactNode } from 'react';

  export interface GoogleOAuthProviderProps {
    clientId: string;
    children: ReactNode;
  }

  export const GoogleOAuthProvider: React.FC<GoogleOAuthProviderProps>;
  
  export interface UseGoogleLoginOptions {
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    flow?: 'auth-code' | 'implicit';
  }

  export function useGoogleLogin(options?: UseGoogleLoginOptions): () => void;
  
  export function useGoogleOneTapLogin(options?: {
    onSuccess: (response: any) => void;
    onError?: (error: any) => void;
  }): void;
}








