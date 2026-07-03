import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { GOOGLE_CLIENT_ID } from '../config';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: 'popup' | 'redirect';
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: GoogleButtonText;
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: GoogleAccountsIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  disabled?: boolean;
  text?: GoogleButtonText;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleScriptPromise = null;
      reject(new Error('Google sign-in could not be loaded.'));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  disabled = false,
  text = 'signin_with',
  onCredential,
  onError,
}) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
    errorHandlerRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      return;
    }

    let isMounted = true;

    loadGoogleScript()
      .then(() => {
        if (!isMounted || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: (response) => {
            if (!response.credential) {
              errorHandlerRef.current?.('Google did not return a sign-in credential.');
              return;
            }

            credentialHandlerRef.current(response.credential);
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
        });
      })
      .catch((error) => {
        errorHandlerRef.current?.(
          error instanceof Error ? error.message : 'Google sign-in could not be loaded.',
        );
      });

    return () => {
      isMounted = false;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 40,
        opacity: disabled ? 0.65 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        width: '100%',
      }}
    >
      <Box
        ref={buttonRef}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      />
    </Box>
  );
};

export default GoogleSignInButton;
