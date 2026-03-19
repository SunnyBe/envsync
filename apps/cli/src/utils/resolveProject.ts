import axios from 'axios';
import { Config } from '../config/config';
import { CLI_SOURCE_HEADER } from '../lib/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProjectStub {
  id: string;
  name: string;
}

/**
 * Accepts either a project UUID or a project name.
 * If it looks like a UUID it is returned as-is; otherwise the project list is
 * fetched and matched case-insensitively by name.
 */
export async function resolveProject(nameOrId: string, config: Config): Promise<string> {
  if (UUID_RE.test(nameOrId)) return nameOrId;

  const res = await axios.get<{ projects: ProjectStub[] }>(`${config.apiUrl}/projects`, {
    headers: { ...CLI_SOURCE_HEADER, Authorization: `Bearer ${config.token}` },
  });

  const match = res.data.projects.find((p) => p.name.toLowerCase() === nameOrId.toLowerCase());

  if (!match) {
    throw new Error(`Project "${nameOrId}" not found. Run: envsync project list`);
  }

  return match.id;
}
