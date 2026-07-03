const DEFAULT_RETRIES = 3;
const BASE_DELAY_MS = 400;

function isPrismaConnectionError(error) {
  if (!error) return false;

  const message = String(error.message || '').toLowerCase();
  const code = String(error.code || error.cause?.code || '').toUpperCase();

  return (
    code === 'P1001'
    || code === 'P1017'
    || code === 'P2024'
    || message.includes("can't reach database server")
    || message.includes('timed out fetching a new connection from the connection pool')
    || message.includes('server has closed the connection')
    || message.includes('connection terminated unexpectedly')
    || message.includes('getaddrinfo enotfound')
    || message.includes('econnrefused')
    || message.includes('etimedout')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withPrismaRetry(fn, { retries = DEFAULT_RETRIES, baseDelayMs = BASE_DELAY_MS } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isPrismaConnectionError(error) || attempt >= retries) {
        throw error;
      }
      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

async function connectPrismaWithRetry(prisma, options = {}) {
  return withPrismaRetry(() => prisma.$connect(), options);
}

async function pingDatabase(prisma, options = {}) {
  return withPrismaRetry(() => prisma.$queryRaw`SELECT 1`, options);
}

module.exports = {
  isPrismaConnectionError,
  withPrismaRetry,
  connectPrismaWithRetry,
  pingDatabase,
};
