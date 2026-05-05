/**
 * Configuration Redis pour le système de notifications
 * 
 * Ce fichier configure la connexion Redis utilisée par:
 * - Bull/BullMQ pour la gestion de la file d'attente
 * - Cache des templates compilés
 * - Sessions WebSocket
 */

const redis = require('redis');

/**
 * Configuration de connexion Redis
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times) => {
    // Stratégie de reconnexion exponentielle
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
};

/**
 * Configuration Bull/BullMQ pour la file d'attente
 */
const bullConfig = {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
  },
  defaultJobOptions: {
    attempts: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '5', 10),
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    },
    removeOnComplete: 100, // Garder les 100 derniers jobs complétés
    removeOnFail: 500, // Garder les 500 derniers jobs échoués
  },
  limiter: {
    max: parseInt(process.env.NOTIFICATION_RATE_LIMIT || '100', 10),
    duration: 60000, // Par minute
  },
};

/**
 * Crée et retourne un client Redis
 * @returns {Promise<RedisClient>}
 */
async function createRedisClient() {
  const client = redis.createClient(redisConfig);

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  client.on('ready', () => {
    console.log('Redis Client Ready');
  });

  client.on('reconnecting', () => {
    console.log('Redis Client Reconnecting...');
  });

  await client.connect();
  return client;
}

/**
 * Vérifie la santé de la connexion Redis
 * @param {RedisClient} client
 * @returns {Promise<boolean>}
 */
async function checkRedisHealth(client) {
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

module.exports = {
  redisConfig,
  bullConfig,
  createRedisClient,
  checkRedisHealth,
};
