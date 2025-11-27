<?php
$host = 'localhost';
$user = 'root';
$pass = 'root';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents('db_setup.sql');
    $pdo->exec($sql);

    echo "Database and tables created successfully.";
} catch (PDOException $e) {
    die("DB ERROR: " . $e->getMessage());
}
?>