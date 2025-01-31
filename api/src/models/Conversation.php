<?php

namespace App\models;

use PDO;

class Conversation
{
    public int $id;
    public string $name;

    public static function findByUser(PDO $pdo, int $userId): array
    {
        $sql = "
            SELECT
                c1.id AS id,
                COALESCE(c1.name, GROUP_CONCAT(DISTINCT u.first_name ORDER BY u.first_name SEPARATOR ', ')) AS name,
                c1.type AS type,
                p1.user_id AS current_user_id
            FROM
                conversations c1
            JOIN
                participants p1 ON c1.id = p1.conversation_id
            JOIN
                participants p2 ON c1.id = p2.conversation_id
            JOIN
                users u ON p2.user_id = u.id
            WHERE
                p1.user_id = :user_id
                AND p2.user_id != :user_id
            GROUP BY
                c1.id, c1.name, c1.type, p1.user_id;
    ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findById(PDO $pdo, int $id, int $userId): array
    {
        $sql = "
            SELECT
                c1.id AS id,
                COALESCE(c1.name, GROUP_CONCAT(DISTINCT u.first_name ORDER BY u.first_name SEPARATOR ', ')) AS name,
                c1.type AS type,
                p1.user_id AS current_user_id
            FROM
                conversations c1
            JOIN
                participants p1 ON c1.id = p1.conversation_id
            JOIN
                participants p2 ON c1.id = p2.conversation_id
            JOIN
                users u ON p2.user_id = u.id
            WHERE
                p1.user_id = :user_id
                AND p2.user_id != :user_id
                AND c1.id = :id
            GROUP BY
                c1.id, c1.name, c1.type, p1.user_id;
    ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }


    /**
     * Crée une nouvelle conversation dans la base de données.
     *
     * @param \PDO $pdo
     * @param ?string $name Le titre de la conversation
     * @param array $participants Un tableau des IDs des utilisateurs participants
     * @return int L'ID de la conversation créée
     */
    public static function create(PDO $pdo, ?string $name, array $participants)
    {
        // Commencer une transaction pour s'assurer que tout se passe bien
        $pdo->beginTransaction();

        try {
            // Préparer la requête SQL pour insérer la conversation
            $stmt = $pdo->prepare("INSERT INTO conversations (name) VALUES (:name)");
            $stmt->execute(['name' => $name]);

            // Récupérer l'ID de la conversation insérée
            $conversationId = $pdo->lastInsertId();

            // Ajouter les participants à la conversation
            foreach ($participants as $userId) {
                $stmt = $pdo->prepare("INSERT INTO participants (conversation_id, user_id) VALUES (:conversation_id, :user_id)");
                $stmt->execute(['conversation_id' => $conversationId, 'user_id' => $userId]);
            }

            // Valider la transaction
            $pdo->commit();

            // Retourner l'ID de la conversation nouvellement créée
            return $conversationId;

        } catch (\Exception $e) {
            // Si une erreur se produit, annuler la transaction
            $pdo->rollBack();
            throw $e; // Relancer l'exception pour gérer l'erreur ailleurs
        }
    }
}
