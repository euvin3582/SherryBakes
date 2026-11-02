<?php
// Booking a call with an agent, using the Mid Atlantic Insurance booking system (same office calendar,
// hours, holidays and invite emails). Requests are passed to its appointment.php, server to server:
//   GET  ?t=<token>            -> the visitor's free call times, or their booked time
//   POST {"t": token, "slot"}  -> books that slot and emails a calendar invite
// The token comes from lead.php. lead-config.php can override the address with 'midatlantic_appointment_url'.

require __DIR__ . '/db.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const DEFAULT_APPOINTMENT_URL = 'https://midatlanticinsurancegroup.com/midatlanticapi/appointment.php';

$post = $_SERVER['REQUEST_METHOD'] === 'POST';
if (!$post && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

if ($post) {
    $d = json_decode(file_get_contents('php://input', false, null, 0, 2000), true);
    $token = is_array($d) ? (string) ($d['t'] ?? '') : '';
    $slot = is_array($d) ? (string) ($d['slot'] ?? '') : '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $slot)) {
        respond(400, ['ok' => false, 'error' => 'Please pick one of the times shown.']);
    }
} else {
    $token = (string) ($_GET['t'] ?? '');
}
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    respond(400, ['ok' => false, 'error' => 'This booking link is not valid. Please call us to book.']);
}

$url = config()['midatlantic_appointment_url'] ?? DEFAULT_APPOINTMENT_URL;

$ch = curl_init($post ? $url : $url . '?' . http_build_query(['t' => $token]));
$opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Content-Type: application/json', 'User-Agent: Mozilla/5.0 SherryBakes'],
];
if ($post) {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = json_encode(['t' => $token, 'slot' => $slot]);
}
curl_setopt_array($ch, $opts);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$error = curl_error($ch);
curl_close($ch);

$json = is_string($body) ? json_decode($body, true) : null;
if (!is_array($json)) {
    error_log("appointment API failed: HTTP $status $error " . substr((string) $body, 0, 200));
    respond(502, ['ok' => false, 'error' => 'Could not load the times. Please call us to book.']);
}
// Pass the booking system's answer straight through (its messages are written for visitors)
respond($status ?: 502, $json);
