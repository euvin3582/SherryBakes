<?php
// Shared database connection for the api/ scripts.
// Settings live in lead-config.php in the account's home folder, outside the website folder so
// visitors can't read them. The site may sit at ~/public_html/<domain>/ or directly at
// ~/<domain>/ (cPanel's newer addon-domain layout), so the folders above this one are
// searched in turn, nearest first.

// Prices go out as 36.11, not 36.1099999999999994: the server's PHP is set to write numbers at full precision.
ini_set('serialize_precision', '-1');

function find_config() {
    $dir = dirname(__DIR__); // the website folder; start one level above it
    for ($i = 0; $i < 4; $i++) {
        $dir = dirname($dir);
        if (is_file($dir . '/lead-config.php')) return $dir . '/lead-config.php';
        if ($dir === dirname($dir)) break; // reached the top of the disk
    }
    return null;
}

// Settings from lead-config.php: database login, compulife_auth_id for quote.php, and the optional mail settings.
function config() {
    static $cfg = null;
    if ($cfg === null) {
        $path = find_config();
        if ($path === null) {
            error_log('lead-config.php not found in any folder above ' . dirname(__DIR__));
            respond(500, ['ok' => false, 'error' => 'Server not configured']);
        }
        $cfg = require $path;
    }
    return $cfg;
}

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $cfg = config();
        $pdo = new PDO(
            "mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4",
            $cfg['user'],
            $cfg['pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
        );
    }
    return $pdo;
}

function respond($status, $body) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($body);
    exit;
}

function text($value, $max) {
    $value = trim((string) $value);
    $value = preg_replace('/\s+/', ' ', $value);
    return mb_substr($value, 0, $max);
}

// Age on their last birthday, or null when the date is not a real, past 'YYYY-MM-DD' date.
function age_from_dob($dob) {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $dob);
    if (!$date || $date->format('Y-m-d') !== $dob) return null;
    $today = new DateTimeImmutable('today');
    return $date > $today ? null : $date->diff($today)->y;
}

// Ad layout values the site sends: photo-top, photo-bottom, banner. Anything else is stored as null.
function ad_layout($value) {
    return in_array($value, ['photo-top', 'photo-bottom', 'banner'], true) ? $value : null;
}
