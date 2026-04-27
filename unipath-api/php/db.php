<?php
/**
 * db.php
 * Connexion PDO à la base de données PostgreSQL
 * Utilisé par les modules PHP de UniPath
 */

class Database {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            // Lire DATABASE_URL depuis l'environnement
            $databaseUrl = getenv('DATABASE_URL');

            if (!$databaseUrl) {
                // Charger depuis .env si pas en variable d'environnement
                $envFile = __DIR__ . '/../.env';
                if (file_exists($envFile)) {
                    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                    foreach ($lines as $line) {
                        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                            [$key, $value] = explode('=', $line, 2);
                            putenv(trim($key) . '=' . trim($value, '"\''));
                        }
                    }
                    $databaseUrl = getenv('DATABASE_URL');
                }
            }

            if (!$databaseUrl) {
                throw new Exception('DATABASE_URL non définie');
            }

            // Parser l'URL PostgreSQL
            $parsed = parse_url($databaseUrl);
            $host   = $parsed['host'];
            $port   = $parsed['port'] ?? 5432;
            $dbname = ltrim($parsed['path'], '/');
            $user   = $parsed['user'];
            $pass   = $parsed['pass'];

            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require";

            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT            => 5,
            ]);
        }

        return self::$instance;
    }
}
