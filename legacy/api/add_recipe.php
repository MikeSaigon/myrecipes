<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug_log.txt');
error_reporting(E_ALL);

try {
    require_once '../config.php';

    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed', 405);
    }


    $pdo->beginTransaction();

    // Handle Image Upload
    $imagePath = 'images/default_recipe.png';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../images/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('recipe_') . '.' . $fileExtension;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imagePath = 'images/' . $fileName;
        }
    }

    // Insert Recipe
    $stmt = $pdo->prepare("INSERT INTO recipes (title, description, prep_time, cook_time, servings, difficulty, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_POST['title'],
        $_POST['description'] ?: null,
        $_POST['prep_time'] ?: null,
        $_POST['cook_time'] ?: null,
        !empty($_POST['servings']) ? $_POST['servings'] : null,
        $_POST['difficulty'] ?: null,
        $imagePath
    ]);
    $recipeId = $pdo->lastInsertId();

    // Insert Ingredients
    if (isset($_POST['ing_name']) && is_array($_POST['ing_name'])) {
        $stmt = $pdo->prepare("INSERT INTO ingredients (recipe_id, amount, measurement, name) VALUES (?, ?, ?, ?)");
        $amounts = $_POST['ing_amount'];
        $measures = $_POST['ing_measure'];
        $names = $_POST['ing_name'];

        for ($i = 0; $i < count($names); $i++) {
            if (!empty($names[$i])) {
                $stmt->execute([$recipeId, $amounts[$i], $measures[$i], $names[$i]]);
            }
        }
    }

    // Insert Instructions
    if (isset($_POST['instructions'])) {
        $stmt = $pdo->prepare("INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES (?, ?, ?)");
        foreach ($_POST['instructions'] as $index => $inst) {
            if (!empty(trim($inst))) {
                $stmt->execute([$recipeId, $index + 1, $inst]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $recipeId]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Global Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    echo json_encode(['error' => $e->getMessage()]);
}
?>