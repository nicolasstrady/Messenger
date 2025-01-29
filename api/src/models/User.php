<?php

namespace App\Models;

use PDO;

class User
{
    public int $id;
    public string $username;
    public string $email;
    public string $password;

    public static function findAll(PDO $pdo): array
    {
        $stmt = $pdo->query("SELECT * FROM users");
        return $stmt->fetchAll();
    }

    // La méthode findByEmail récupère un utilisateur en fonction de son email
    public static function findByEmail(PDO $pdo, string $email): ?User
    {
        // Préparer la requête SQL
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);

        // Exécuter la requête
        $stmt->execute();

        // Vérifier si un utilisateur a été trouvé
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si un utilisateur est trouvé, on retourne une instance de la classe User
        if ($userData) {
            $user = new self();
            $user->id = $userData['id'];
            $user->email = $userData['email'];
            $user->username = $userData['username'];
            $user->first_name = $userData['first_name'];
            $user->last_name = $userData['last_name'];
            $user->created_at = $userData['created_at'];
            $user->password = $userData['password'];

            return $user;
        }

        // Sinon, on retourne null
        return null;
    }

    // Méthode pour créer un nouvel utilisateur avec first_name et last_name
    public static function create($pdo, $email, $password, $username, $firstName, $lastName)
    {
        // Préparer la requête SQL pour insérer un nouvel utilisateur
        $sql = "INSERT INTO users (email, password, username, first_name, last_name) 
                VALUES (:email, :password, :username, :first_name, :last_name)";

        // Préparer la déclaration
        $stmt = $pdo->prepare($sql);

        // Lier les paramètres
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);

        // Exécuter la requête
        if ($stmt->execute()) {
            // Retourner l'ID de l'utilisateur inséré
            return $pdo->lastInsertId();
        } else {
            throw new \Exception("Failed to create user");
        }
    }
}
