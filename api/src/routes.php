<?php

namespace App\Routes;

use App\Controllers\ConversationController;
use App\Controllers\MessageController;
use App\Controllers\UserController;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface;

require_once __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

// CORS middleware DOIT être après les autres
$app->add(function (Request $request, RequestHandler $handler): ResponseInterface {
    $origin = $request->getHeaderLine('Origin');
    $allowedOrigins = [
        'http://192.168.1.193:3000',
        'http://localhost:3000',
    ];

    $response = $handler->handle($request);

    if (in_array($origin, $allowedOrigins)) {
        $response = $response->withHeader('Access-Control-Allow-Origin', $origin);
    }

    return $response
        ->withHeader('Access-Control-Allow-Credentials', 'true')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
});

// $app->add(function (Request $request, RequestHandler $handler) {
//     $response = $handler->handle($request);
//     return $response
//         ->withHeader('Access-Control-Allow-Credentials', 'true')
//         ->withHeader('Access-Control-Allow-Origin', 'http://192.168.1.193:3000')
//
//         ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');
// //         ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
// });

//$afterMiddleware = function (Request $request, RequestHandler $handler) {
//    // Proceed with the next middleware
//    $response = $handler->handle($request);
//
//    // Modify the response after the application has processed the request
//    $response = $response
//        ->withHeader('Access-Control-Allow-Origin', 'http://192.168.1.193:3000')
//        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
//        ->withHeader('Access-Control-Allow-Credentials', 'true');
//
//    return $response;
//};

//$app->add($afterMiddleware);
//$app->add($beforeMiddleware);
// $app->add($corsMiddleware);

$app->get('/users', [UserController::class, 'listUsers']);
$app->post('/login', [UserController::class, 'login']);
$app->post('/register', [UserController::class, 'register']);
$app->get('/conversations/user/{userId}', [ConversationController::class, 'listConversationsByUser']);
$app->get('/conversations/{id}/user/{userId}', [ConversationController::class, 'getConversationById']);

$app->get('/messages/{conversationId}', [MessageController::class, 'listMessagesByConversation']);
$app->post('/conversations', [ConversationController::class, 'createConversation']);
$app->get('/notifications', [UserController::class, 'getNotifications']);


$app->run();
