<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

function uploadFileToS3($filePath, $fileName)
{

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
    $dotenv->load();

// Créer un client S3 avec tes identifiants
    $s3Client = new S3Client([
        'version' => 'latest',
        'region' => $_ENV['AWS_REGION'],
        'credentials' => [
            'key' => $_ENV['AWS_ACCESS_KEY_ID'],
            'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'],
        ]
    ]);

    try {
// Upload du fichier sur S3
        $result = $s3Client->putObject([
            'Bucket' => $_ENV['AWS_BUCKET'],
            'Key' => 'uploads/' . $fileName,  // Le chemin et le nom du fichier dans le bucket
            'SourceFile' => $filePath,  // Le chemin du fichier local
        ]);

// Retourner l'URL du fichier uploadé
        return $result['ObjectURL'];
    } catch (AwsException $e) {
// Gestion des erreurs
        echo "Erreur lors de l'upload : " . $e->getMessage();
        return null;
    }
}
