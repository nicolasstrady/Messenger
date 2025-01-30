<?php

namespace App\models;

use PDO;

class Notification
{
    public int $id;
    public int $user_id;
    public int $conversation_id;
    public int $message_id;
    public string $created_at;

    /**
     * Récupère toutes les notifications d'un utilisateur donné.
     * @param PDO $pdo Connexion à la base de données
     * @param int $userId Identifiant de l'utilisateur
     * @return array Liste des notifications
     */
    public static function findByUser(PDO $pdo, int $userId): array
    {
        // Préparer la requête SQL
        $stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

        // Exécuter la requête
        $stmt->execute();

        // Récupérer les résultats sous forme de tableau associatif
        $notificationsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Transformer chaque entrée en instance de Notification
        $notifications = [];
        foreach ($notificationsData as $data) {
            $notification = new self();
            $notification->id = $data['id'];
            $notification->user_id = $data['user_id'];
            $notification->conversation_id = $data['conversation_id'];
            $notification->message_id = $data['message_id'];
            $notification->created_at = $data['created_at'];
            $notifications[] = $notification;
        }

        return $notifications;
    }
}
