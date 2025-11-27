<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id'])) {
        throw new Exception('Recipe ID is required');
    }

    $recipeId = $data['id'];

    // Get image path before deleting
    $stmt = $pdo->prepare("SELECT image_path FROM recipes WHERE id = ?");
    $stmt->execute([$recipeId]);
    $recipe = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$recipe) {
        throw new Exception('Recipe not found');
    }

    $pdo->beginTransaction();

    // Delete recipe (cascades to ingredients and instructions)
    $stmt = $pdo->prepare("DELETE FROM recipes WHERE id = ?");
    $stmt->execute([$recipeId]);

    $pdo->commit();

    // Delete image file if it exists and is not the default
    if ($recipe['image_path'] && $recipe['image_path'] !== 'images/default_recipe.png') {
        $imageFilePath = '../' . $recipe['image_path'];
        if (file_exists($imageFilePath)) {
            unlink($imageFilePath);
        }
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>