<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "blood_donation";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Replace with YOUR actual email
$your_email = "your-actual-email@gmail.com";

// Delete existing test donors
$conn->query("DELETE FROM donors WHERE email LIKE '%test%' OR email LIKE '%@%'");

// Add test donor with YOUR email
$sql = "INSERT INTO donors (full_name, email, phone, age, blood_type, gender, address, city, state, pincode) 
        VALUES ('Test Donor', '$your_email', '1234567890', 30, 'O+', 'Male', '123 Test St', 'New York', 'NY', '10001')";

if ($conn->query($sql) === TRUE) {
    echo "✅ Test donor added successfully with email: $your_email";
} else {
    echo "❌ Error: " . $conn->error;
}

$conn->close();
?>