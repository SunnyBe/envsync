import { name, version, description } from '../package.json';

export const CLI_NAME = name;
export const CLI_VERSION = version;
export const CLI_DESCRIPTION = description;

/** Default API URL — can be overridden with --api-url at login time. */
export const DEFAULT_API_URL = 'https://envsync-backend-production.up.railway.app';
