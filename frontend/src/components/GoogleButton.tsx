import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              width?: number;
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            }
          ) => void;
        };
      };
    };
  }
}

type GoogleButtonProps = {
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
};

export function GoogleButton({ onCredential, text = 'continue_with' }: GoogleButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID not set — Google button will not render.');
      return;
    }
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res.credential) onCredential(res.credential);
      },
    });

    if (ref.current) {
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        width: 320,
        shape: 'rectangular',
      });
    }
  }, [clientId, onCredential, text]);

  if (!clientId) {
    return (
      <p className="rounded-md border border-chalk bg-paper p-3 text-xs text-ink/60">
        Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}