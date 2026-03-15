import prisma from '../../infrastructure/prisma/client';
import { encrypt, decrypt } from '../../services/encryption/encryption.service';
import { PushEnvInput, PullEnvInput, PullEnvOutput } from './env.types';
import logger from '../../infrastructure/logger';

export async function pushVariables(input: PushEnvInput): Promise<void> {
  const { projectId, env, variables } = input;
  for (const [key, value] of Object.entries(variables)) {
    const valueEnc = encrypt(value);
    await prisma.envVariable.upsert({
      where: { projectId_key_env: { projectId, key, env } } as any,
      update: { valueEnc, isActive: true },
      create: { projectId, key, valueEnc, env },
    });
  }
  logger.info({ audit: true, action: 'env.push', projectId, env, count: Object.keys(variables).length }, 'audit');
}

export async function pullVariables(input: PullEnvInput): Promise<PullEnvOutput> {
  const { projectId, env } = input;
  const records = await prisma.envVariable.findMany({
    where: { projectId, env, isActive: true },
  });
  const variables: Record<string, string> = {};
  for (const record of records) {
    variables[record.key] = decrypt(record.valueEnc);
  }
  logger.info({ audit: true, action: 'env.pull', projectId, env, count: records.length }, 'audit');
  return { variables };
}
