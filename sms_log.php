<?php
// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "blood_donation";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log SMS notification
    $donor_id = intval($_POST['donor_id']);
    $emergency_data = $conn->real_escape_string($_POST['emergency_data']);
    $status = $conn->real_escape_string($_POST['status']);
    $timestamp = $conn->real_escape_string($_POST['timestamp']);
    
    $sql = "INSERT INTO sms_notifications (donor_id, emergency_data, status, sent_at) 
            VALUES ($donor_id, '$emergency_data', '$status', '$timestamp')";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "SMS notification logged"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to log SMS: " . $conn->error]);
    }
}

$conn->close();
?>