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

    $recipeId = $_POST['id'] ?? null;
    if (!$recipeId) {
        throw new Exception('Recipe ID is required for update');
    }

    // Handle Image Upload
    $imagePath = null;
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

            // Delete old image
            $stmt = $pdo->prepare("SELECT image_path FROM recipes WHERE id = ?");
            $stmt->execute([$recipeId]);
            $oldImage = $stmt->fetchColumn();
            if ($oldImage && $oldImage !== 'images/default_recipe.png' && file_exists('../' . $oldImage)) {
                unlink('../' . $oldImage);
            }
        }
    }

    // Update Recipe Base Details
    $sql = "UPDATE recipes SET title = ?, description = ?, prep_time = ?, cook_time = ?, servings = ?, difficulty = ?";
    $params = [
        $_POST['title'],
        $_POST['description'] ?: null,
        $_POST['prep_time'] ?: null,
        $_POST['cook_time'] ?: null,
        !empty($_POST['servings']) ? $_POST['servings'] : null,
        $_POST['difficulty'] ?: null
    ];

    if ($imagePath) {
        $sql .= ", image_path = ?";
        $params[] = $imagePath;
    }

    $sql .= " WHERE id = ?";
    $params[] = $recipeId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Update Ingredients (Delete all and re-insert)
    $stmt = $pdo->prepare("DELETE FROM ingredients WHERE recipe_id = ?");
    $stmt->execute([$recipeId]);

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

    // Update Instructions (Delete all and re-insert)
    $stmt = $pdo->prepare("DELETE FROM instructions WHERE recipe_id = ?");
    $stmt->execute([$recipeId]);

    if (isset($_POST['instructions'])) {
        $stmt = $pdo->prepare("INSERT INTO instructions (recipe_id, step_number, instruction_text) VALUES (?, ?, ?)");
        foreach ($_POST['instructions'] as $index => $inst) {
            if (!empty(trim($inst))) {
                $stmt->execute([$recipeId, $index + 1, $inst]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Update Error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>