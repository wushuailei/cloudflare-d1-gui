import type {
  ApiResponse,
  Database,
  TableInfo,
  TableSchema,
  QueryResult,
  WorkerMode,
  DatabaseConnection,
} from '../types';

class ApiService {
  private baseUrl = '/api';

  // Helper to make requests with optional auth headers
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    connection?: DatabaseConnection
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth headers for remote mode
    if (connection?.mode === 'remote' && connection.accountId && connection.apiToken) {
      headers['X-CF-Account-ID'] = connection.accountId;
      headers['X-CF-API-Token'] = connection.apiToken;
      if (connection.databaseId) {
        headers['X-CF-Database-ID'] = connection.databaseId;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
      };
    }
  }

  // Get worker mode capabilities
  async getMode(): Promise<ApiResponse<WorkerMode>> {
    return this.request<WorkerMode>('/mode');
  }

  // Get list of databases
  async getDatabases(connection?: DatabaseConnection): Promise<ApiResponse<Database[]>> {
    return this.request<Database[]>('/databases', {}, connection);
  }

  // Execute SQL query
  async executeQuery(
    sql: string,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<QueryResult>> {
    return this.request<QueryResult>(
      '/query',
      {
        method: 'POST',
        body: JSON.stringify({ sql }),
      },
      connection
    );
  }

  // Get list of tables
  async getTables(connection?: DatabaseConnection): Promise<ApiResponse<TableInfo[]>> {
    return this.request<TableInfo[]>('/tables', {}, connection);
  }

  // Get table schema
  async getTableSchema(
    tableName: string,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<TableSchema>> {
    return this.request<TableSchema>(`/tables/${tableName}/schema`, {}, connection);
  }

  // Get table data with pagination
  async getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<QueryResult>> {
    const offset = (page - 1) * pageSize;
    const sql = `SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`;
    return this.executeQuery(sql, connection);
  }

  // Get table row count
  async getTableCount(
    tableName: string,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<number>> {
    const result = await this.executeQuery(
      `SELECT COUNT(*) as count FROM ${tableName}`,
      connection
    );
    if (result.success && result.data?.rows?.[0]) {
      return {
        success: true,
        data: result.data.rows[0][0] as number,
      };
    }
    return {
      success: false,
      error: '获取表行数失败',
    };
  }

  // Insert data
  async insertData(
    tableName: string,
    data: Record<string, unknown>,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<QueryResult>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    // Note: For parameterized queries, we need to send params separately
    // For now, we'll construct the SQL directly (be careful with SQL injection)
    const sqlWithValues = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')})`;
    
    return this.executeQuery(sqlWithValues, connection);
  }

  // Update data
  async updateData(
    tableName: string,
    data: Record<string, unknown>,
    where: string,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<QueryResult>> {
    const sets = Object.entries(data)
      .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`)
      .join(', ');
    const sql = `UPDATE ${tableName} SET ${sets} WHERE ${where}`;
    return this.executeQuery(sql, connection);
  }

  // Delete data
  async deleteData(
    tableName: string,
    where: string,
    connection?: DatabaseConnection
  ): Promise<ApiResponse<QueryResult>> {
    const sql = `DELETE FROM ${tableName} WHERE ${where}`;
    return this.executeQuery(sql, connection);
  }

  // Test connection
  async testConnection(connection: DatabaseConnection): Promise<ApiResponse<boolean>> {
    const result = await this.executeQuery('SELECT 1', connection);
    return {
      success: result.success,
      data: result.success,
      error: result.error,
    };
  }
}

export const apiService = new ApiService();
