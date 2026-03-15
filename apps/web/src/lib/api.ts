import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({ baseURL: API_URL });

// Attach Bearer token from localStorage before every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('envsync_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages for the UI
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error: string }>) => {
    const message = err.response?.data?.error ?? err.message ?? 'Unexpected error';
    return Promise.reject(new Error(message));
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  apiToken: string;
}

export type Environment = 'development' | 'staging' | 'production';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const register = (email: string) =>
  apiClient.post<RegisterResponse>('/auth/register', { email }).then((r) => r.data);

export const verifyToken = (token: string) =>
  apiClient
    .get<{ email: string; id: string }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// ── Projects ──────────────────────────────────────────────────────────────────

export const getProjects = () =>
  apiClient.get<{ projects: Project[] }>('/projects').then((r) => r.data.projects);

export const createProject = (name: string) =>
  apiClient.post<{ id: string; name: string }>('/projects', { name }).then((r) => r.data);

// ── Env Vars ─────────────────────────────────────────────────────────────────

export const getEnvVars = (projectId: string, env: Environment) =>
  apiClient
    .get<{ variables: Record<string, string> }>(`/projects/${projectId}/env`, { params: { env } })
    .then((r) => r.data.variables);

export const pushEnvVars = (
  projectId: string,
  env: Environment,
  variables: Record<string, string>
) =>
  apiClient
    .post<{ ok: boolean }>(`/projects/${projectId}/env`, { variables }, { params: { env } })
    .then((r) => r.data);
