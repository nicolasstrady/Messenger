<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\models\Message;

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../database/connection.php';

class MessageController
{
    public static function listMessagesByConversation(Request $request, Response $response, array $args): Response
    {
        // Récupérer l'ID de la conversation depuis l'argument de la route
        $conversationId = (int)$args['conversationId'];

        // Se connecter à la base de données
        $pdo = getDatabaseConnection();

        // Récupérer les messages de la conversation
        $messages = Message::findByConversation($pdo, $conversationId);

        // Encoder en JSON et écrire dans le corps de la réponse
        $response->getBody()->write(json_encode($messages));

        // Ajouter le bon type de contenu et retourner la réponse
        return $response->withHeader('Content-Type', 'application/json');
    }
}
