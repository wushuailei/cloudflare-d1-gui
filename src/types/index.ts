// Database connection types
export type ConnectionMode = 'local' | 'remote';

export interface DatabaseConnection {
  id: string;
  name: string;
  mode: ConnectionMode;
  description?: string;
  accountId?: string;
  apiToken?: string;
  databaseId?: string;
}

export interface AppConfig {
  version: string;
  connections: DatabaseConnection[];
  activeConnectionId: string;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  queryHistory: boolean;
  maxHistoryItems: number;
}

// Database types
export interface Database {
  uuid: string;
  name: string;
  version: string;
  created_at: string;
  num_tables?: number;
  file_size?: number;
}

export interface TableInfo {
  name: string;
  type: string;
  sql?: string;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
  indexes?: IndexInfo[];
}

export interface IndexInfo {
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  meta?: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface PaginatedData<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// SQL Query History
export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
}

// Worker API types
export interface WorkerMode {
  local: boolean;
  remote: boolean;
  hasBinding: boolean;
}
