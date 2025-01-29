<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Conversation;

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../models/Conversation.php';
require_once __DIR__ . '/../database/connection.php';

class ConversationController
{
    public static function listConversationsByUser(Request $request, Response $response, array $args): Response
    {
        // Récupérer l'ID de l'utilisateur depuis l'argument de la route
        $userId = (int)$args['userId'];

        // Se connecter à la base de données
        $pdo = getDatabaseConnection();

        // Récupérer les conversations de l'utilisateur
        $conversations = Conversation::findByUser($pdo, $userId);

        // Encoder en JSON et écrire dans le corps de la réponse
        $response->getBody()->write(json_encode($conversations));

        // Ajouter le bon type de contenu et retourner la réponse
        return $response->withHeader('Content-Type', 'application/json');
    }

    // Méthode pour créer une nouvelle conversation
    public static function createConversation(Request $request, Response $response, array $args): Response
    {
        // Récupérer les données envoyées dans le corps de la requête
        $data = json_decode($request->getBody()->getContents(), true);

        // Vérifier les données nécessaires
        if (!isset($data['participants']) || !is_array($data['participants'])) {
            // Retourner une réponse 400 avec un message d'erreur
            $response->getBody()->write(json_encode(['error' => 'Title and participants are required.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $title = $data['title'];
        $participants = $data['participants'];

        // Se connecter à la base de données
        $pdo = getDatabaseConnection();

        // Créer la conversation dans la base de données
        try {
            $conversationId = Conversation::create($pdo, $title, $participants); // Assure-toi d'avoir une méthode `create` dans ton modèle
            $response->getBody()->write(json_encode([
                'id' => $conversationId,
                'title' => $title,
                'participants' => $participants
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            // Retourner une réponse 500 en cas d'erreur interne
            $response->getBody()->write(json_encode(['error' => 'Failed to create conversation.']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
