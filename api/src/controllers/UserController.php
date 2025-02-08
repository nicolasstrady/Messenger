<?php

namespace App\controllers;

use App\models\Notification;
use App\models\User;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../database/connection.php';
require_once __DIR__ . '/../utils/ImageUploader.php'; // Assure-toi que le chemin est correct

class UserController
{
// Méthode pour l'enregistrement d'un utilisateur
    public static function register(Request $request, Response $response, array $args): Response
    {

        // Récupérer les données de formulaire
        $data = $request->getParsedBody();

        // Récupérer les champs envoyés
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $username = $data['username'] ?? null;
        $firstName = $data['first_name'] ?? null;
        $lastName = $data['last_name'] ?? null;

        // Vérifier les champs obligatoires
        if (!$email || !$password || !$username || !$firstName || !$lastName) {
            $response->getBody()->write(json_encode(['error' => 'Email, password, username, first name, and last name are required.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Vérifier si une image a été envoyée
        $imageUrl = null;
        $uploadedFiles = $request->getUploadedFiles();
        if (isset($uploadedFiles['profile_image']) && $uploadedFiles['profile_image']->getError() === UPLOAD_ERR_OK) {
            $file = $uploadedFiles['profile_image'];
            $fileName = uniqid() . '-' . basename($file->getClientFilename()); // Générer un nom unique pour le fichier
            $filePath = $file->getStream()->getMetadata('uri'); // Chemin temporaire du fichier

            $imageUrl = uploadFileToS3($filePath, $fileName);
            if (!$imageUrl) {
                $response->getBody()->write(json_encode(['error' => 'Failed to upload profile image.']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        }

        $email = $data['email'];
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        $username = $data['username'];
        $firstName = $data['first_name'];
        $lastName = $data['last_name'];

        // Connexion à la base de données
        $pdo = getDatabaseConnection();

        try {
            // Créer l'utilisateur en enregistrant l'image de profil
            $userId = User::create($pdo, $email, $password, $username, $firstName, $lastName, $imageUrl);

            // Retourner l'utilisateur créé
            $response->getBody()->write(json_encode([
                'id' => $userId,
                'email' => $email,
                'username' => $username,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'profile_image' => $imageUrl
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Failed to register user.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    // Méthode pour se connecter (login)
    public static function login(Request $request, Response $response, array $args): Response
    {
        // Récupérer les données envoyées dans le corps de la requête
        $data = json_decode($request->getBody()->getContents(), true);

        // Vérifier que l'email et le mot de passe sont présents
        if (!isset($data['email']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Email and password are required.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $email = $data['email'];
        $password = $data['password'];

        // Se connecter à la base de données
        $pdo = getDatabaseConnection();

        // Vérifier si l'utilisateur existe dans la base de données
        try {
            $user = User::findByEmail($pdo, $email); // Méthode findByEmail() pour retrouver un utilisateur par email
            if ($user && password_verify($password, $user->password)) {  // Vérifier le mot de passe
                // Générer un jeton JWT
                $key = 'votre_cle_secrète';  // Clé secrète pour signer le jeton (assurez-vous de la garder secrète)
                $payload = [
                    'id' => $user->id,
                    'email' => $user->email,
                    'username' => $user->username,
                    'exp' => time() + 3600  // Expiration du jeton dans 1 heure
                ];
                $jwt = JWT::encode($payload, $key, 'HS256');

                // Retourner le jeton
                $response->getBody()->write(json_encode(['token' => $jwt, 'userId' => $user->id, 'user_first_name' => $user->first_name, 'user_last_name' => $user->last_name, 'user_profile_image' => $user->profileImage]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write(json_encode(['error' => 'Invalid credentials.']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Failed to authenticate user.']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public static function listUsers(Request $request, Response $response, array $args): Response
    {
        $pdo = getDatabaseConnection();
        // Récupérer les utilisateurs
        $users = User::findAll($pdo);

        // Encoder en JSON
        $response->getBody()->write(json_encode($users));

        // Ajouter le bon type de contenu et retourner la réponse
        return $response->withHeader('Content-Type', 'application/json');
    }

    public static function getNotifications(Request $request, Response $response, array $args): Response
    {
        $queryParams = $request->getQueryParams();
        $userId = $queryParams['userId'] ?? null;

        if (!$userId) {
            $response->getBody()->write(json_encode(["error" => "Missing userId"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            // Se connecter à la base de données
            $pdo = getDatabaseConnection();
            // Récupérer les notifications d'un utilisateur via le modèle
            $notifications = Notification::findByUser($pdo, $userId);

            $response->getBody()->write(json_encode($notifications));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["error" => "Failed to fetch notifications", "message" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
