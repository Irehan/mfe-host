// packages/host/src/types/global.d.ts
declare global {
  interface Window {
    [key: string]: any;
    eventBus?: any;
    reportingApp?: any;
    authApp?: any;
    bookingApp?: any;
  }
}

export {};