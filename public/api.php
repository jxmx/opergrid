 <?php
/**
 *
 *    Copyright 2026 Jason D. McCormick
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://github.com/jxmx/opergrid/blob/main/LICENSE
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 * api.php — handles signup read/write for the Amateur Radio event scheduler
 * All data stored in flat JSON files.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once(__DIR__ . "/../config.php");

// ── helpers ────────────────────────────────────────────────────────────────

function readSignups($signups_file): array {
    if (!file_exists($signups_file)) return [];
    $data = json_decode(file_get_contents($signups_file), true);
    if (!is_array($data)) return [];

    return array_map(function($record) {
        unset($record['email']);
        return $record;
    }, $data);
}

function writeSignups($signups_file, array $data): bool {
    return file_put_contents($signups_file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

function slotKey(string $stationId, string $timeslot): string {
    return $stationId . '|' . $timeslot;
}

function jsonError(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

function jsonOk(array $payload = []): void {
    echo json_encode(array_merge(['success' => true], $payload));
    exit;
}

// ── routing ────────────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];

$action = "";
if(isset($_GET['action'])){
    if (preg_match('/^[A-Za-z]+$/', $_GET['action'])) {
        $action = $_GET['action'];
    } else {
        http_response_code(400);
        jsonError("invalid action code");
        exit;
    }
} else {
    http_response_code(400);
    jsonError("invalid action code");
    exit;
}

$event_code = "";
if(isset($_GET['event'])){
    if (preg_match('/^[A-Za-z0-9]+$/', $_GET['event'])) {
        $event_code = "_" . $_GET['event'];
    } else {
        http_response_code(400);
        jsonError("invalid event code");
        exit;
    }
    if($event_code === "_default"){
        $event_code = "";
    }
}

$config_file = DATA_BASE . "/config" . $event_code . ".json";
$signups_file = DATA_BASE . "/signups" . $event_code . ".json";

// GET /api.php?action=config  — return config.json
if ($action === 'config') {
    if (!file_exists($config_file)) jsonError( $config_file . ' not found', 500);
    $config = json_decode(file_get_contents($config_file), true);
    jsonOk(['config' => $config]);
}

// GET /api.php?action=signups  — return all signups
if ($action === 'signups') {
    jsonOk(['signups' => readSignups($signups_file)]);
}

// POST /api.php?action=claim  — claim a slot
if ($method === 'POST' && $action === 'claim') {

    if(!is_readable($config_file)){
        http_response_code(500);
        jsonError("system not configured for event");
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);

    $station  = substr(trim($body['station']  ?? ''), 0, 30);
    $timeslot = substr(trim($body['timeslot'] ?? ''), 0, 30);
    $name     = substr(trim($body['name']     ?? ''), 0, 30);
    $callsign = strtoupper(substr(trim($body['callsign'] ?? ''), 0, 10));
    $email    = substr(trim($body['email']    ?? ''), 0, 40);

    if (!$station || !$timeslot)
        jsonError('station and timeslot are required');
    if (!$name)
        jsonError('Name is required');
    if (!preg_match('/^[A-Z0-9\/]{3,10}$/', $callsign))
        jsonError('Invalid callsign format');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        jsonError('Invalid email address');

    $signups = readSignups($signups_file);
    $key = slotKey($station, $timeslot);

    if (isset($signups[$key])) jsonError('This slot is already taken');

    $signups[$key] = [
        'name'      => htmlspecialchars($name, ENT_QUOTES),
        'callsign'  => $callsign,
        'email'     => $email,
        'claimed_at'=> date('c'),
    ];

    if (!writeSignups($signups_file, $signups)) jsonError('Could not save signup', 500);

    jsonOk(['slot' => $key, 'signup' => $signups[$key]]);
}

/**
// DELETE /api.php?action=release — release a slot (admin use)
if ($method === 'DELETE' && $action === 'release') {
    $body = json_decode(file_get_contents('php://input'), true);
    $station  = trim($body['station']  ?? '');
    $timeslot = trim($body['timeslot'] ?? '');
    if (!$station || !$timeslot) jsonError('station and timeslot are required');

    $signups = readSignups();
    $key = slotKey($station, $timeslot);
    if (!isset($signups[$key])) jsonError('Slot not found', 404);

    unset($signups[$key]);
    if (!writeSignups($signups)) jsonError('Could not save', 500);
    jsonOk(['released' => $key]);
}
*/