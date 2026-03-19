import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'X-EnvSync-Source': 'web' },
});

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
  },
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  role: 'owner' | 'EDITOR' | 'VIEWER';
}

export interface ProjectDetail extends Project {
  userRole: 'owner' | 'EDITOR' | 'VIEWER';
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

export const getProject = (id: string) =>
  apiClient.get<ProjectDetail>(`/projects/${id}`).then((r) => r.data);

export const deleteProject = (id: string) => apiClient.delete(`/projects/${id}`);

// ── Env Vars ─────────────────────────────────────────────────────────────────

export const getEnvVars = (projectId: string, env: Environment) =>
  apiClient
    .get<{ variables: Record<string, string> }>(`/projects/${projectId}/env`, { params: { env } })
    .then((r) => r.data.variables);

export const pushEnvVars = (
  projectId: string,
  env: Environment,
  variables: Record<string, string>,
) =>
  apiClient
    .post<{ ok: boolean }>(`/projects/${projectId}/env`, { variables }, { params: { env } })
    .then((r) => r.data);

export const deleteEnvVar = (projectId: string, env: Environment, key: string) =>
  apiClient.delete(`/projects/${projectId}/env/${encodeURIComponent(key)}`, { params: { env } });

export const renameProject = (id: string, name: string) =>
  apiClient.patch<{ id: string; name: string }>(`/projects/${id}`, { name }).then((r) => r.data);

// ── Auth extras ───────────────────────────────────────────────────────────────

export const regenerateToken = () =>
  apiClient.post<{ apiToken: string }>('/auth/regenerate').then((r) => r.data);

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  source: 'cli' | 'web' | 'manual' | null;
  createdAt: string;
}

export interface AuditPage {
  events: AuditEvent[];
  nextCursor: string | null;
}

export interface AuditQueryParams {
  limit?: number;
  cursor?: string;
  action?: string;
  source?: string;
}

export const getAuditEvents = (params: AuditQueryParams = {}) =>
  apiClient.get<AuditPage>('/audit', { params }).then((r) => r.data);

// ── Members ───────────────────────────────────────────────────────────────────

export interface ProjectMember {
  id: string;
  email: string;
  role: 'EDITOR' | 'VIEWER';
  accepted: boolean;
  userId: string | null;
  createdAt: string;
}

export const getMembers = (projectId: string) =>
  apiClient
    .get<{ members: ProjectMember[] }>(`/projects/${projectId}/members`)
    .then((r) => r.data.members);

export const inviteMember = (projectId: string, email: string, role: 'EDITOR' | 'VIEWER') =>
  apiClient
    .post<{ inviteToken: string }>(`/projects/${projectId}/members`, { email, role })
    .then((r) => r.data);

export const removeMember = (projectId: string, memberId: string) =>
  apiClient.delete(`/projects/${projectId}/members/${memberId}`);
