<?php
// Use PHPMailer for real email sending
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendRealEmailWithSMTP($toEmail, $toName, $subject, $message) {
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your-email@gmail.com'; // YOUR GMAIL
        $mail->Password   = 'your-app-password';    // GMAIL APP PASSWORD
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        // Recipients
        $mail->setFrom('your-email@gmail.com', 'BloodDonor Emergency');
        $mail->addAddress($toEmail, $toName);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $message;
        $mail->AltBody = strip_tags($message);
        
        $mail->send();
        
        file_put_contents('email_success.log', "✅ EMAIL SENT TO: $toEmail ($toName) - " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
        return true;
        
    } catch (Exception $e) {
        file_put_contents('email_error.log', "❌ EMAIL FAILED TO: $toEmail - " . $e->getMessage() . " - " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
        return false;
    }
}
?>