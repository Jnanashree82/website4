<?php
// Simple email test
$to = "your-email@gmail.com"; // REPLACE WITH YOUR EMAIL
$subject = "TEST EMAIL from BloodDonor";
$message = "This is a test email from your blood donation system. If you receive this, emails are working!";
$headers = "From: test@blooddonor.com\r\n";

echo "<h2>Testing Email System...</h2>";
echo "<p>Sending test email to: $to</p>";

if (mail($to, $subject, $message, $headers)) {
    echo "<p style='color: green;'>✅ Email sent successfully!</p>";
    echo "<p>Check your email inbox (and spam folder).</p>";
} else {
    echo "<p style='color: red;'>❌ Email failed to send.</p>";
    echo "<p>Error: " . error_get_last()['message'] . "</p>";
}

// Test file writing
file_put_contents('test.log', "Test at: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
echo "<p>✅ Log file written successfully.</p>";
?>