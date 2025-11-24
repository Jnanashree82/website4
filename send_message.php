<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $phone = $data['phone'];
    $message = $data['message'];
    
    // Method 1: WhatsApp via CallMeBot
    $result = sendWhatsAppMessage($phone, $message);
    
    echo json_encode($result);
}

function sendWhatsAppMessage($phone, $message) {
    // Clean phone number
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // For Indian numbers: add country code
    if (strlen($phone) === 10) {
        $phone = '91' . $phone; // India country code
    }
    
    // CallMeBot WhatsApp API
    $apiKey = '123456'; // Default test key
    $url = "https://api.callmebot.com/whatsapp.php?phone=$phone&text=" . urlencode($message) . "&apikey=$apiKey";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Log the attempt
    file_put_contents('whatsapp_log.txt', "To: $phone | Response: $response\n", FILE_APPEND);
    
    if (strpos($response, 'Message sent successfully') !== false) {
        return ['status' => 'success', 'message' => 'WhatsApp sent successfully'];
    } else {
        return ['status' => 'error', 'message' => 'WhatsApp failed: ' . $response];
    }
}
?>