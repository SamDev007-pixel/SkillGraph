<?php
$dbname = 'skillgraph';
$user = 'root';
$pass = '';
$pdo = null;

try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e1) {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3306;dbname=$dbname;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e2) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e2->getMessage()
        ]);
        exit;
    }
}

function getDb() {
    global $pdo;
    return $pdo;
}
