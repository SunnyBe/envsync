export interface LivenessResponse {
  status: 'ok';
}

export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  database: 'connected' | 'unreachable';
}

export interface SystemResponse {
  status: 'ok';
  uptime: number;        // process uptime in seconds
  memory: {
    rss: number;         // resident set size (bytes)
    heapUsed: number;
    heapTotal: number;
  };
  database: 'connected' | 'unreachable';
  node: string;          // Node.js version
}
