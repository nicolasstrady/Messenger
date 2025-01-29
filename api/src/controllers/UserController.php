<?php

namespace App\Controllers;

use App\Models\User;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../database/connection.php';

class UserController
{
// Méthode pour l'enregistrement d'un utilisateur
    public static function register(Request $request, Response $response, array $args): Response
    {
        // Récupérer les données envoyées dans le corps de la requête
        $data = json_decode($request->getBody(), true);

        // Vérifier si toutes les données nécessaires sont présentes
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['username']) || !isset($data['first_name']) || !isset($data['last_name'])) {
            $response->getBody()->write(json_encode(['error' => 'Email, password, username, first name, and last name are required.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $email = $data['email'];
        $password = password_hash($data['password'], PASSWORD_BCRYPT); // Hachage du mot de passe
        $username = $data['username'];
        $firstName = $data['first_name'];
        $lastName = $data['last_name'];

        // Se connecter à la base de données
        $pdo = getDatabaseConnection();

        // Créer l'utilisateur dans la base de données
        try {
            $userId = User::create($pdo, $email, $password, $username, $firstName, $lastName);

            // Retourner une réponse avec l'ID de l'utilisateur créé
            $response->getBody()->write(json_encode(['id' => $userId, 'email' => $email, 'username' => $username, 'first_name' => $firstName, 'last_name' => $lastName]));
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
                $response->getBody()->write(json_encode(['token' => $jwt, 'userId' => $user->id, 'user_first_name' => $user->first_name, 'user_last_name' => $user->last_name ]));
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
}
