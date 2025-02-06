<?php

namespace App\models;

use PDO;

class User
{
    public int $id;
    public string $username;
    public string $email;
    public string $password;
    public string $first_name;
    public string $last_name;
    public ?string $profileImage = null; // Image de profil (peut être null)

    public static function findAll(PDO $pdo): array
    {
        $stmt = $pdo->query("SELECT * FROM users");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // La méthode findByEmail récupère un utilisateur en fonction de son email
    public static function findByEmail(PDO $pdo, string $email): ?User
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();

        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userData) {
            $user = new self();
            $user->id = $userData['id'];
            $user->email = $userData['email'];
            $user->username = $userData['username'];
            $user->first_name = $userData['first_name'];
            $user->last_name = $userData['last_name'];
            $user->password = $userData['password'];
            $user->profileImage = $userData['profile_image'] ?? null;

            return $user;
        }

        return null;
    }

    // Méthode pour créer un nouvel utilisateur avec image de profil optionnelle
    public static function create(PDO $pdo, string $email, string $password, string $username, string $firstName, string $lastName, ?string $profileImage = null): int
    {
        $sql = "INSERT INTO users (email, password, username, first_name, last_name, profile_image) 
                VALUES (:email, :password, :username, :first_name, :last_name, :profile_image)";

        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        $stmt->bindParam(':profile_image', $profileImage);

        if ($stmt->execute()) {
            return (int)$pdo->lastInsertId();
        } else {
            throw new \Exception("Failed to create user");
        }
    }
}
