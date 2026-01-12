interface Env {
  DB?: D1Database;
}

interface D1Result {
  results?: unknown[];
  success: boolean;
  meta?: unknown;
  error?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CF-Account-ID, X-CF-API-Token, X-CF-Database-ID',
};

// Helper to create JSON response
function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Helper to handle errors
function errorResponse(error: string, status: number = 500) {
  return jsonResponse({ success: false, error }, status);
}

// Execute query on local D1 database
async function executeLocalQuery(db: D1Database, sql: string): Promise<D1Result> {
  try {
    const result = await db.prepare(sql).all();
    return {
      success: true,
      results: result.results,
      meta: result.meta,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
    };
  }
}

// Execute query on remote D1 database via Cloudflare API
async function executeRemoteQuery(
  accountId: string,
  databaseId: string,
  apiToken: string,
  sql: string
): Promise<D1Result> {
  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    const data = await response.json() as { success?: boolean; errors?: Array<{ message: string }>; result?: Array<{ results?: unknown[]; meta?: unknown }> };

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.errors?.[0]?.message || 'Remote query failed',
      };
    }

    // Cloudflare API returns results in a different format
    const result = data.result?.[0];
    return {
      success: true,
      results: result?.results || [],
      meta: result?.meta,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Remote API request failed',
    };
  }
}

// Get list of databases from Cloudflare API
async function getRemoteDatabases(accountId: string, apiToken: string) {
  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    const data = await response.json() as { success?: boolean; errors?: Array<{ message: string }>; result?: unknown[] };

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.errors?.[0]?.message || 'Failed to fetch databases',
      };
    }

    return {
      success: true,
      data: data.result || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API request failed',
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check if API route
    if (!url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 404 });
    }

    // Get auth headers for remote mode
    const accountId = request.headers.get('X-CF-Account-ID');
    const apiToken = request.headers.get('X-CF-API-Token');
    const databaseId = request.headers.get('X-CF-Database-ID');

    // Determine mode
    const isRemoteMode = !!(accountId && apiToken);
    const isLocalMode = !!env.DB;

    try {
      // GET /api/mode - Get supported modes
      if (url.pathname === '/api/mode' && request.method === 'GET') {
        return jsonResponse({
          success: true,
          data: {
            local: isLocalMode,
            remote: true, // Always support remote mode
            hasBinding: isLocalMode,
          },
        });
      }

      // GET /api/databases - Get database list
      if (url.pathname === '/api/databases' && request.method === 'GET') {
        if (isRemoteMode && accountId && apiToken) {
          const result = await getRemoteDatabases(accountId, apiToken);
          return jsonResponse(result);
        } else if (isLocalMode) {
          // Return info about local database
          return jsonResponse({
            success: true,
            data: [{
              name: 'local-dev-db',
              uuid: 'local',
              version: '1.0',
              created_at: new Date().toISOString(),
            }],
          });
        } else {
          return errorResponse('No database connection available', 400);
        }
      }

      // POST /api/query - Execute SQL query
      if (url.pathname === '/api/query' && request.method === 'POST') {
        const body = await request.json() as { sql: string };
        
        if (!body.sql) {
          return errorResponse('SQL query is required', 400);
        }

        let result: D1Result;

        if (isRemoteMode && accountId && apiToken && databaseId) {
          result = await executeRemoteQuery(accountId, databaseId, apiToken, body.sql);
        } else if (isLocalMode && env.DB) {
          result = await executeLocalQuery(env.DB, body.sql);
        } else {
          return errorResponse('No database connection available', 400);
        }

        if (!result.success) {
          return errorResponse(result.error || 'Query failed', 500);
        }

        // Format response
        const columns = result.results && result.results.length > 0
          ? Object.keys(result.results[0] as Record<string, unknown>)
          : [];
        
        const rows = result.results?.map((row: unknown) => 
          columns.map(col => (row as Record<string, unknown>)[col])
        ) || [];

        return jsonResponse({
          success: true,
          data: {
            columns,
            rows,
            meta: result.meta,
          },
        });
      }

      // GET /api/tables - Get list of tables
      if (url.pathname === '/api/tables' && request.method === 'GET') {
        const sql = "SELECT name, type, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
        
        let result: D1Result;

        if (isRemoteMode && accountId && apiToken && databaseId) {
          result = await executeRemoteQuery(accountId, databaseId, apiToken, sql);
        } else if (isLocalMode && env.DB) {
          result = await executeLocalQuery(env.DB, sql);
        } else {
          return errorResponse('No database connection available', 400);
        }

        if (!result.success) {
          return errorResponse(result.error || 'Failed to get tables', 500);
        }

        return jsonResponse({
          success: true,
          data: result.results || [],
        });
      }

      // GET /api/tables/:tableName/schema - Get table schema
      if (url.pathname.match(/^\/api\/tables\/[^/]+\/schema$/) && request.method === 'GET') {
        const tableName = url.pathname.split('/')[3];
        const sql = `PRAGMA table_info(${tableName})`;
        
        let result: D1Result;

        if (isRemoteMode && accountId && apiToken && databaseId) {
          result = await executeRemoteQuery(accountId, databaseId, apiToken, sql);
        } else if (isLocalMode && env.DB) {
          result = await executeLocalQuery(env.DB, sql);
        } else {
          return errorResponse('No database connection available', 400);
        }

        if (!result.success) {
          return errorResponse(result.error || 'Failed to get schema', 500);
        }

        return jsonResponse({
          success: true,
          data: {
            tableName,
            columns: result.results || [],
          },
        });
      }

      return errorResponse('Not found', 404);
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
} satisfies ExportedHandler<Env>;
