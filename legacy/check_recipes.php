<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT * FROM recipes ORDER BY id DESC LIMIT 2");
    $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($recipes as $recipe) {
        echo "ID: " . $recipe['id'] . "\n";
        echo "Title: " . $recipe['title'] . "\n";

        // Get Ingredients count
        $stmt_ing = $pdo->prepare("SELECT COUNT(*) FROM ingredients WHERE recipe_id = ?");
        $stmt_ing->execute([$recipe['id']]);
        $ing_count = $stmt_ing->fetchColumn();
        echo "Ingredients count: " . $ing_count . "\n";

        // Get Instructions count
        $stmt_inst = $pdo->prepare("SELECT COUNT(*) FROM instructions WHERE recipe_id = ?");
        $stmt_inst->execute([$recipe['id']]);
        $inst_count = $stmt_inst->fetchColumn();
        echo "Instructions count: " . $inst_count . "\n";
        echo "-----------------------------------\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>