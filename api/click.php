<?php
// Records each time an ad (or link) opens the quote form, so clicks can be compared with leads.
// Called by js/leads.js with navigator.sendBeacon; the visitor never waits on it.

require __DIR__ . '/db.php';
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false]);
}

$d = json_decode(file_get_contents('php://input', false, null, 0, 4000), true);
if (!is_array($d)) {
    respond(400, ['ok' => false]);
}

$source = text($d['source'] ?? '', 60);
$photo  = text($d['adPhoto'] ?? '', 80);
$page   = text($d['page'] ?? '', 255);

try {
    $stmt = db()->prepare('INSERT INTO ad_clicks (source, ad_layout, ad_photo, page) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $source !== '' ? $source : 'direct',
        ad_layout($d['adLayout'] ?? ''),
        $photo !== '' ? $photo : null,
        $page !== '' ? $page : null,
    ]);
} catch (Throwable $e) {
    error_log('click save failed: ' . $e->getMessage());
    respond(500, ['ok' => false]);
}

respond(200, ['ok' => true]);
