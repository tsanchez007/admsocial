<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$secret = 'admsocial2026';
if ($_POST['secret'] !== $secret) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No file']); exit;
}

$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '.' . $ext;
$dest = $uploadDir . $filename;

if (move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
    $url = 'https://darkorange-clam-603295.hostingersite.com/uploads/' . $filename;
    echo json_encode(['success' => true, 'url' => $url]);
} else {
    echo json_encode(['error' => 'Upload failed']);
}
