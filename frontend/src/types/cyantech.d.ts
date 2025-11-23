// TypeScript declarations for Cyantech SDK Web Components

declare module '@regulaforensics/vp-frontend-document-components' {
  // This module provides web components via custom elements
  export {};
}

declare module '@regulaforensics/vp-frontend-face-components' {
  // This module provides web components via custom elements
  export {};
}

// Declare custom element types for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'document-reader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'locale'?: string;
        'theme'?: string;
        'service-url'?: string;
        'scenario'?: string;
      };
      'face-capture': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'locale'?: string;
        'theme'?: string;
        'service-url'?: string;
        'mode'?: string;
      };
      'face-liveness': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'locale'?: string;
        'theme'?: string;
        'service-url'?: string;
      };
    }
  }
}

export {};



