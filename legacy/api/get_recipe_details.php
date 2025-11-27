<?php
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ID']);
    exit;
}

$id = $_GET['id'];

try {
    // Get Recipe
    $stmt = $pdo->prepare("SELECT * FROM recipes WHERE id = ?");
    $stmt->execute([$id]);
    $recipe = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$recipe) {
        http_response_code(404);
        echo json_encode(['error' => 'Recipe not found']);
        exit;
    }

    // Get Ingredients
    $stmt = $pdo->prepare("SELECT * FROM ingredients WHERE recipe_id = ?");
    $stmt->execute([$id]);
    $recipe['ingredients'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get Instructions
    $stmt = $pdo->prepare("SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number ASC");
    $stmt->execute([$id]);
    $recipe['instructions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($recipe);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>