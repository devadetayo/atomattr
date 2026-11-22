<?php
// Minimal view/copy counter. Drop this on any PHP host and point window.ATOMATTR_STATS_URL at it.
// Data lives in stats.json next to this file (make the folder writable). No personal data is stored.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$file = __DIR__ . '/stats.json';
$valid = fn($id) => is_string($id) && preg_match('/^[a-z0-9:_-]{1,120}$/i', $id);
$fp = fopen($file, 'c+'); flock($fp, LOCK_EX);
$raw = stream_get_contents($fp); $data = $raw ? json_decode($raw, true) : []; if (!is_array($data)) $data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $in = json_decode(file_get_contents('php://input'), true);
  $id = $in['id'] ?? ''; $type = $in['type'] ?? '';
  if ($valid($id) && in_array($type, ['view', 'copy'], true)) {
    $k = $type === 'copy' ? 'c' : 'v';
    $data[$id] = $data[$id] ?? ['v' => 0, 'c' => 0]; $data[$id][$k]++;
    ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($data));
  }
  flock($fp, LOCK_UN); fclose($fp); echo '{"ok":true}'; exit;
}
$out = [];
foreach (explode(',', $_GET['ids'] ?? '') as $id) if ($valid($id)) $out[$id] = $data[$id] ?? ['v' => 0, 'c' => 0];
flock($fp, LOCK_UN); fclose($fp); echo json_encode($out ?: new stdClass);
