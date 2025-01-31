<?php

namespace App\Routes;

use App\Controllers\ConversationController;
use App\Controllers\MessageController;
use App\Controllers\UserController;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Factory\AppFactory;

require_once __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

//$app->addBodyParsingMiddleware();
//$app->addRoutingMiddleware();
//$app->addErrorMiddleware(true, true, true);
//
//$app->add(function (ServerRequestInterface $request, RequestHandlerInterface $handler) use ($app): ResponseInterface {
//    if ($request->getMethod() === 'OPTIONS') {
//        $response = $app->getResponseFactory()->createResponse();
//    } else {
//        $response = $handler->handle($request);
//    }
//
//    $response = $response
//        ->withHeader('Access-Control-Allow-Credentials', 'true')
//        ->withHeader('Access-Control-Allow-Origin', '*')
//        ->withHeader('Access-Control-Allow-Headers', '*')
//        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
//        ->withHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
//        ->withHeader('Pragma', 'no-cache');
//
//    if (ob_get_contents()) {
//        ob_clean();
//    }
//
//    return $response;
//});

//$beforeMiddleware = function (Request $request, RequestHandler $handler) use ($app) {
//    // Example: Check for a specific header before proceeding
//    $auth = $request->getHeaderLine('Authorization');
//    if ($auth) {
//        // Short-circuit and return a response immediately
//        $response = $app->getResponseFactory()->createResponse();
//        $response->getBody()->write('Unauthorized');
//
//        return $response->withStatus(401);
//    }
//
//    // Proceed with the next middleware
//    return $handler->handle($request);
//};

$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

$app->add(function (Request $request, RequestHandler $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Credentials', 'true')
        ->withHeader('Access-Control-Allow-Origin', 'http://192.168.1.68:3000')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');
//         ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

//$afterMiddleware = function (Request $request, RequestHandler $handler) {
//    // Proceed with the next middleware
//    $response = $handler->handle($request);
//
//    // Modify the response after the application has processed the request
//    $response = $response
//        ->withHeader('Access-Control-Allow-Origin', 'http://192.168.1.68:3000')
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
