<?php
require_once '../config.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM recipes ORDER BY created_at DESC");
    $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($recipes);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>