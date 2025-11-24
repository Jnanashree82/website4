<?php
// emergency.php - Handle emergency blood requests
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

// Handle emergency request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleEmergencyRequest($conn);
}

function handleEmergencyRequest($conn) {
    // Check if all required emergency fields are present
    $required_fields = ['patientName', 'contactPerson', 'hospital', 'hospitalCity', 'bloodType', 'units', 'urgency', 'contact'];
    
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            echo json_encode(["status" => "error", "message" => "Please fill all required fields: " . $field]);
            return;
        }
    }

    // Sanitize emergency data
    $patientName = $conn->real_escape_string(trim($_POST['patientName']));
    $contactPerson = $conn->real_escape_string(trim($_POST['contactPerson']));
    $hospital = $conn->real_escape_string(trim($_POST['hospital']));
    $hospitalCity = $conn->real_escape_string(trim($_POST['hospitalCity']));
    $hospitalAddress = isset($_POST['hospitalAddress']) ? $conn->real_escape_string(trim($_POST['hospitalAddress'])) : '';
    $bloodType = $conn->real_escape_string($_POST['bloodType']);
    $units = intval($_POST['units']);
    $urgency = $conn->real_escape_string($_POST['urgency']);
    $contact = $conn->real_escape_string(trim($_POST['contact']));
    $message = isset($_POST['message']) ? $conn->real_escape_string(trim($_POST['message'])) : '';
    
    // Validate units
    if ($units < 1 || $units > 20) {
        echo json_encode(["status" => "error", "message" => "Units must be between 1 and 20"]);
        return;
    }
    
    // Create emergency record in database
    $sql = "INSERT INTO emergency_requests (patient_name, contact_person, hospital, hospital_city, hospital_address, blood_type, units_needed, urgency_level, contact_number, additional_notes, created_at) 
            VALUES ('$patientName', '$contactPerson', '$hospital', '$hospitalCity', '$hospitalAddress', '$bloodType', $units, '$urgency', '$contact', '$message', NOW())";
    
    if ($conn->query($sql) === TRUE) {
        $emergency_id = $conn->insert_id;
        
        echo json_encode([
            "status" => "success", 
            "message" => "🚨 EMERGENCY REQUEST SUBMITTED SUCCESSFULLY!",
            "emergency_id" => $emergency_id,
            "data" => [
                "patientName" => $patientName,
                "hospital" => $hospital,
                "city" => $hospitalCity,
                "bloodType" => $bloodType,
                "units" => $units,
                "urgency" => $urgency
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to create emergency request: " . $conn->error]);
    }
}

$conn->close();
?>