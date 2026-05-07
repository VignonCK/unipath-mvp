<?php
/**
 * Service d'envoi d'emails UniPath
 * Utilise PHPMailer pour l'envoi d'emails transactionnels
 */

require_once __DIR__ . '/db.php';

class EmailService {
    private $host;
    private $port;
    private $username;
    private $password;
    private $from;
    private $db;

    public function __construct() {
        // Charger la configuration depuis .env
        $this->host = getenv('EMAIL_HOST') ?: 'smtp.example.com';
        $this->port = getenv('EMAIL_PORT') ?: 587;
        $this->username = getenv('EMAIL_USER') ?: '';
        $this->password = getenv('EMAIL_PASS') ?: '';
        $this->from = getenv('EMAIL_FROM') ?: 'noreply@unipath.bj';
        
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Envoyer un email de pré-inscription
     */
    public function envoyerEmailPreInscription($data) {
        $to = $data['candidatEmail'];
        $subject = '[UniPath] Confirmation de votre pré-inscription';
        
        $message = $this->getTemplatePreInscription($data);
        
        // Envoyer via SMTP
        $sent = $this->sendViaSMTP($to, $subject, $message);
        
        // Enregistrer dans la base de données
        $this->enregistrerEnvoi([
            'notification_id' => $data['notificationId'] ?? null,
            'user_id' => $data['candidatId'],
            'recipient' => $to,
            'subject' => $subject,
            'status' => $sent ? 'SENT' : 'FAILED',
            'sent_at' => $sent ? date('Y-m-d H:i:s') : null
        ]);
        
        return ['success' => $sent];
    }

    /**
     * Envoyer un email de validation/convocation
     */
    public function envoyerEmailValidation($data) {
        $to = $data['candidatEmail'];
        $subject = '[UniPath] Convocation au concours ' . $data['concours'];
        
        $message = $this->getTemplateValidation($data);
        
        $sent = $this->sendViaSMTP($to, $subject, $message);
        
        $this->enregistrerEnvoi([
            'notification_id' => $data['notificationId'] ?? null,
            'user_id' => $data['candidatId'],
            'recipient' => $to,
            'subject' => $subject,
            'status' => $sent ? 'SENT' : 'FAILED',
            'sent_at' => $sent ? date('Y-m-d H:i:s') : null
        ]);
        
        return ['success' => $sent];
    }

    /**
     * Envoyer un email de rejet
     */
    public function envoyerEmailRejet($data) {
        $to = $data['candidatEmail'];
        $subject = '[UniPath] Décision concernant votre candidature - ' . $data['concours'];
        
        $message = $this->getTemplateRejet($data);
        
        $sent = $this->sendViaSMTP($to, $subject, $message);
        
        $this->enregistrerEnvoi([
            'notification_id' => $data['notificationId'] ?? null,
            'user_id' => $data['candidatId'],
            'recipient' => $to,
            'subject' => $subject,
            'status' => $sent ? 'SENT' : 'FAILED',
            'sent_at' => $sent ? date('Y-m-d H:i:s') : null
        ]);
        
        return ['success' => $sent];
    }

    /**
     * Envoyer via SMTP (Gmail)
     */
    private function sendViaSMTP($to, $subject, $htmlBody) {
        try {
            // Connexion SMTP
            $smtp = fsockopen('ssl://' . $this->host, 465, $errno, $errstr, 30);
            if (!$smtp) {
                error_log("Erreur SMTP: $errstr ($errno)");
                return false;
            }

            // Lire la réponse du serveur
            fgets($smtp, 515);

            // EHLO
            fputs($smtp, "EHLO " . $this->host . "\r\n");
            fgets($smtp, 515);

            // AUTH LOGIN
            fputs($smtp, "AUTH LOGIN\r\n");
            fgets($smtp, 515);

            // Username
            fputs($smtp, base64_encode($this->username) . "\r\n");
            fgets($smtp, 515);

            // Password
            fputs($smtp, base64_encode($this->password) . "\r\n");
            $response = fgets($smtp, 515);
            
            if (strpos($response, '235') === false) {
                error_log("Erreur authentification SMTP");
                fclose($smtp);
                return false;
            }

            // MAIL FROM
            fputs($smtp, "MAIL FROM: <{$this->from}>\r\n");
            fgets($smtp, 515);

            // RCPT TO
            fputs($smtp, "RCPT TO: <$to>\r\n");
            fgets($smtp, 515);

            // DATA
            fputs($smtp, "DATA\r\n");
            fgets($smtp, 515);

            // Headers et corps
            $headers = "From: UniPath <{$this->from}>\r\n";
            $headers .= "To: $to\r\n";
            $headers .= "Subject: $subject\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "\r\n";

            fputs($smtp, $headers . $htmlBody . "\r\n.\r\n");
            fgets($smtp, 515);

            // QUIT
            fputs($smtp, "QUIT\r\n");
            fclose($smtp);

            return true;
        } catch (Exception $e) {
            error_log("Erreur envoi SMTP: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Template HTML pour pré-inscription
     */
    private function getTemplatePreInscription($data) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #008751;">Pré-inscription confirmée</h2>
                <p>Bonjour <strong>' . htmlspecialchars($data['candidatPrenom']) . ' ' . htmlspecialchars($data['candidatNom']) . '</strong>,</p>
                <p>Votre pré-inscription au concours <strong>' . htmlspecialchars($data['concours']) . '</strong> a bien été enregistrée.</p>
                <p>Numéro de dossier : <strong>' . htmlspecialchars($data['numeroDossier']) . '</strong></p>
                <p>Votre fiche de pré-inscription est disponible sur votre espace candidat. La commission étudiera votre dossier et vous serez notifié par email.</p>
                <hr/>
                <p style="color:#888;font-size:12px;">Université d\'Abomey-Calavi | Année 2025-2026</p>
            </div>
        </body>
        </html>
        ';
    }

    /**
     * Template HTML pour validation
     */
    private function getTemplateValidation($data) {
        $dateExamen = isset($data['dateExamen']) ? '<p><strong>Date de l\'examen :</strong> ' . htmlspecialchars($data['dateExamen']) . '</p>' : '';
        $lieuExamen = isset($data['lieuExamen']) ? '<p><strong>Lieu :</strong> ' . htmlspecialchars($data['lieuExamen']) . '</p>' : '';
        
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #008751;">Votre dossier a été validé !</h2>
                <p>Bonjour <strong>' . htmlspecialchars($data['candidatPrenom']) . ' ' . htmlspecialchars($data['candidatNom']) . '</strong>,</p>
                <p>Nous avons le plaisir de vous informer que votre dossier pour le concours <strong>' . htmlspecialchars($data['concours']) . '</strong> a été validé par la commission.</p>
                <p><strong>Numéro de dossier :</strong> ' . htmlspecialchars($data['numeroDossier']) . '</p>
                ' . $dateExamen . '
                ' . $lieuExamen . '
                <p>Votre convocation officielle est disponible sur votre espace candidat. <strong>Veuillez l\'imprimer et la présenter le jour de l\'examen avec une pièce d\'identité valide.</strong></p>
                <p style="color: #d97706; font-weight: bold;">⚠️ Tout retard ou absence non justifiée entraîne l\'annulation de votre inscription.</p>
                <hr/>
                <p style="color:#888;font-size:12px;">Université d\'Abomey-Calavi | Année 2025-2026</p>
            </div>
        </body>
        </html>
        ';
    }

    /**
     * Template HTML pour rejet
     */
    private function getTemplateRejet($data) {
        $motif = isset($data['motif']) ? '<p><strong>Motif :</strong> ' . htmlspecialchars($data['motif']) . '</p>' : '';
        
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Décision de la commission</h2>
                <p>Bonjour <strong>' . htmlspecialchars($data['candidatPrenom']) . ' ' . htmlspecialchars($data['candidatNom']) . '</strong>,</p>
                <p>Nous avons le regret de vous informer que votre dossier pour le concours <strong>' . htmlspecialchars($data['concours']) . '</strong> n\'a pas été retenu par la commission.</p>
                ' . $motif . '
                <p>Nous vous encourageons à postuler à nouveau lors des prochaines sessions de concours.</p>
                <p>Pour toute question, n\'hésitez pas à contacter le service des concours.</p>
                <hr/>
                <p style="color:#888;font-size:12px;">Université d\'Abomey-Calavi | Année 2025-2026</p>
            </div>
        </body>
        </html>
        ';
    }

    /**
     * Headers pour email HTML
     */
    private function getHeaders() {
        return "MIME-Version: 1.0\r\n" .
               "Content-type: text/html; charset=UTF-8\r\n" .
               "From: UniPath <{$this->from}>\r\n" .
               "Reply-To: {$this->from}\r\n" .
               "X-Mailer: PHP/" . phpversion();
    }

    /**
     * Enregistrer l'envoi dans la base de données
     */
    private function enregistrerEnvoi($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO \"EmailDelivery\" 
                (id, \"notificationId\", \"userId\", recipient, subject, status, \"sentAt\", \"createdAt\", \"updatedAt\", attempts)
                VALUES (gen_random_uuid(), :notification_id, :user_id, :recipient, :subject, :status, :sent_at, NOW(), NOW(), 1)
            ");
            
            $stmt->execute([
                ':notification_id' => $data['notification_id'],
                ':user_id' => $data['user_id'],
                ':recipient' => $data['recipient'],
                ':subject' => $data['subject'],
                ':status' => $data['status'],
                ':sent_at' => $data['sent_at']
            ]);
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur enregistrement email: " . $e->getMessage());
            return false;
        }
    }
}

// API endpoint pour appel depuis Node.js
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    $emailService = new EmailService();
    
    try {
        switch ($action) {
            case 'pre-inscription':
                $result = $emailService->envoyerEmailPreInscription($input['data']);
                break;
            case 'validation':
                $result = $emailService->envoyerEmailValidation($input['data']);
                break;
            case 'rejet':
                $result = $emailService->envoyerEmailRejet($input['data']);
                break;
            default:
                $result = ['success' => false, 'error' => 'Action inconnue'];
        }
        
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
