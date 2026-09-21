import { redis } from "../lib/redis";

const DEFAULT_TTL = 300;

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);

  return data ? (JSON.parse(data) as T) : null;
};

export const setCache = async <T>(
  key: string,
  data: T,
  ttl = DEFAULT_TTL,
): Promise<void> => {
  await redis.set(key, JSON.stringify(data), {
    EX: ttl,
  });
};

export const deleteCache = async (key: string): Promise<void> => {
  await redis.del(key);
};
