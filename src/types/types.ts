// D:\web-dev\react-practice\mfe-demo\packages\host\src\types\types.ts
import React from 'react';

// User and Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

// Module Federation Types
export interface MicroFrontendConfig {
  name: string;
  displayName: string;
  url: string;
  scope: string;
  module: string;
  routes: string[];
  roles: string[];
}

export interface MicroFrontendConfigItem {
  name: string;
  displayName: string;
  routes: string[];
  roles: string[];
  module: string;
  url: string;
  scope: string;
}

// App Configuration
export interface AppConfig {
  microFrontends: MicroFrontendConfigItem[];
  fallbackConfig?: {
    showErrorBoundary: boolean;
    retryAttempts: number;
    retryDelay: number;
  };
}

// App State
export interface AppState {
  user: User | null;
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

// Module Loading Types
export interface ModuleLoadError {
  module: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export interface ModuleStats {
  loaded: number;
  loading: number;
  failed: number;
  loadedModules: string[];
  failedLoads: ModuleLoadError[];
}

export interface HealthCheckResult {
  healthy: string[];
  unhealthy: { name: string; error: string }[];
}

// Event Bus Types - Fixed to allow null for componentStack
export interface EventBusEvents {
  'auth:login': { payload: User };
  'auth:logout': null;
  'user:login': User;
  'user:logout': null;
  'booking:created': { payload: BookingData };
  'booking:updated': { payload: BookingData };
  'config:loaded': { payload: AppConfig };
  'module:loaded': { payload: string };
  'module:error': { 
    payload: { 
      module: string; 
      error: string;
      stack?: string | null;
      componentStack?: string | null;  // Allow null to match React's ErrorInfo type
    } 
  };
}

export type EventHandler<T = any> = (data: T) => void;

// Module Federation Container Types
export interface ModuleContainer {
  init: (shared: any) => Promise<void>;
  get: (module: string) => () => Promise<any>;
}

declare global {
  interface Window {
    [key: string]: ModuleContainer | any;
    eventBus?: any;
  }
}

// Component Props Types
export interface RemoteModuleProps {
  config: MicroFrontendConfig;
  props?: Record<string, any>;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: ModuleLoadError; onRetry: () => void }>;
  fallbackComponent?: React.ComponentType;
  user?: User;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  moduleName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Booking Types
export interface BookingData {
  id: string;
  facilityName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedBy: string;
  attendees: number;
  purpose: string;
  createdAt: string;
  specialRequirements?: string;
  contactEmail: string;
}

export interface BookingFilters {
  status?: 'all' | 'confirmed' | 'pending' | 'cancelled';
  dateRange?: {
    start: string;
    end: string;
  };
  facilityType?: string;
  bookedBy?: string;
  searchTerm?: string;
}

// Demo Users
export const DEMO_USERS = {
  admin: { 
    id: '1',
    username: 'admin', 
    email: 'admin@example.com',
    password: 'admin123', 
    role: 'admin' as const 
  },
  user: { 
    id: '2',
    username: 'user', 
    email: 'user@example.com',
    password: 'user123', 
    role: 'user' as const 
  }
};

// Module Manifest Types
export interface ModuleManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  dependencies: Record<string, string>;
  routes: RouteConfig[];
  components: ComponentExport[];
}

export interface RouteConfig {
  path: string;
  component: string;
  roles?: string[];
  exact?: boolean;
  title?: string;
  description?: string;
}

export interface ComponentExport {
  name: string;
  path: string;
  description?: string;
  props?: Record<string, any>;
}

// Navigation Types
export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  roles?: string[];
  children?: NavigationItem[];
}

// Plugin Types
export interface PluginRegistration {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  entryPoint: string;
  permissions: string[];
  routes: RouteConfig[];
  navigation?: NavigationItem[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PluginManifest extends PluginRegistration {
  id: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  loadError?: string;
  instance?: any;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Theme Types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'time';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onReset?: () => void;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'custom';
  size: 'small' | 'medium' | 'large' | 'full';
  data?: any;
  config?: Record<string, any>;
  refreshInterval?: number;
}

export interface ReportData {
  id: string;
  title: string;
  type: 'booking-analytics' | 'user-activity' | 'facility-usage' | 'revenue';
  data: any[];
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  xAxis: string;
  yAxis: string;
  title: string;
  color?: string;
}

// Utility Types
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingProps extends BaseComponentProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ErrorProps extends BaseComponentProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}