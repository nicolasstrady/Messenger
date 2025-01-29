<?php

namespace App\Models;

use PDO;

class Message
{
    public int $id;
    public string $content;
    public int $author_id;
    public int $conversation_id;
    public string $created_at;

    public static function findByConversation(PDO $pdo, int $conversationId): array
    {
        $stmt = $pdo->prepare("SELECT
                                    mes.id AS id,
                                    mes.author_id AS author_id,
                                    mes.conversation_id AS conversation_id,
                                    mes.content AS content,
                                    mes.created_at AS created_at,
                                    mes.read_at AS read_at,
                                    mes.status AS status,
                                    us.first_name AS first_name,
                                    us.last_name AS last_name


                                FROM messages mes
                                INNER JOIN conversations co ON mes.conversation_id = co.id
                                INNER JOIN users us ON mes.author_id = us.id

                                WHERE mes.conversation_id = :conversation_id
                                ORDER BY mes.created_at
        ");
        $stmt->execute(['conversation_id' => $conversationId]);
        return $stmt->fetchAll();
    }
}
