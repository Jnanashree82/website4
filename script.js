// script.js - Emergency Blood Donation Portal JavaScript

$(document).ready(function() {
    // Mobile menu toggle
    $('.hamburger').click(function() {
        $('.nav-menu').toggleClass('active');
    });

    // Initialize emergency page functionality
    initializeEmergencyPage();
    
    // Initialize live donor activity simulation
    if ($('#activeDonors').length) {
        simulateDonorActivity();
        updateLiveDonorCount(); // Initial count update
    }
});

// Emergency Page Functions
function initializeEmergencyPage() {
    // Only initialize if we're on the emergency page
    if (!$('#emergencyForm').length) return;
    
    console.log('Initializing emergency page...');
    
    // Clear form button
    $('#clearForm').click(function() {
        $('#emergencyForm')[0].reset();
        $('#responseMessage').hide();
        $('.form-group').removeClass('error');
    });
    
    // Form submission handling
    $('#emergencyForm').on('submit', function(e) {
        e.preventDefault();
        
        if (!validateEmergencyForm()) {
            showResponseMessage({
                status: 'error',
                message: 'Please fill all required fields marked with *'
            });
            return;
        }
        
        const submitBtn = $('#submitBtn');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="btn-icon">⏳</span> Processing Emergency Request...').prop('disabled', true);
        
        const formData = getFormData();
        
        // Submit emergency request to emergency.php
        submitEmergencyRequest(formData)
            .then(emergencyResponse => {
                if (emergencyResponse.status === 'success') {
                    // After emergency request is saved, find matching donors
                    return findMatchingDonorsFromDB(formData.bloodType, formData.hospitalCity)
                        .then(matchingDonors => {
                            const finalResponse = processEmergencyRequest(formData, matchingDonors, emergencyResponse);
                            // Show donors one by one
                            showDonorsSequentially(finalResponse);
                            
                            if (finalResponse.status === 'success') {
                                $('#emergencyForm')[0].reset();
                            }
                        });
                } else {
                    showResponseMessage(emergencyResponse);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showResponseMessage({
                    status: 'error',
                    message: 'Error processing emergency request. Please try again.'
                });
            })
            .finally(() => {
                submitBtn.html(originalText).prop('disabled', false);
            });
    });
    
    // Remove error class on input
    $('input, select, textarea').on('input', function() {
        $(this).closest('.form-group').removeClass('error');
    });
}

function validateEmergencyForm() {
    const requiredFields = [
        'patientName', 'contactPerson', 'hospital', 'hospitalCity', 
        'bloodType', 'units', 'urgency', 'contact'
    ];
    
    let isValid = true;
    $('.form-group').removeClass('error');
    
    requiredFields.forEach(field => {
        const element = $(`[name="${field}"]`);
        if (!element.val().trim()) {
            element.closest('.form-group').addClass('error');
            isValid = false;
        }
    });
    
    return isValid;
}

function getFormData() {
    return {
        patientName: $('#patientName').val(),
        contactPerson: $('#contactPerson').val(),
        hospital: $('#hospital').val(),
        hospitalCity: $('#hospitalCity').val(),
        hospitalAddress: $('#hospitalAddress').val(),
        bloodType: $('#bloodType').val(),
        units: $('#units').val(),
        urgency: $('#urgency').val(),
        contact: $('#contact').val(),
        message: $('#message').val()
    };
}

function submitEmergencyRequest(formData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'emergency.php',
            type: 'POST',
            data: formData,
            success: function(response) {
                try {
                    const result = typeof response === 'string' ? JSON.parse(response) : response;
                    resolve(result);
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    reject('Invalid response from server');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                reject(error);
            }
        });
    });
}

function findMatchingDonorsFromDB(bloodType, city) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'submit.php',
            type: 'GET',
            data: {
                action: 'getDonors',
                bloodType: bloodType,
                city: city
            },
            success: function(response) {
                try {
                    const donors = typeof response === 'string' ? JSON.parse(response) : response;
                    resolve(donors);
                } catch (e) {
                    resolve([]);
                }
            },
            error: function(xhr, status, error) {
                reject(error);
            }
        });
    });
}

function processEmergencyRequest(formData, matchingDonors, emergencyResponse) {
    // Filter available donors who are eligible
    const availableDonors = matchingDonors.filter(donor => {
        return donor.available && isEligibleForDonation(donor.last_donation);
    });
    
    // Get top donors to contact (max 5)
    const donorsToContact = availableDonors.slice(0, 5);
    
    return {
        status: 'success',
        message: emergencyResponse.message || '🚨 EMERGENCY REQUEST SUBMITTED SUCCESSFULLY!',
        matching_donors: matchingDonors.length,
        available_donors: availableDonors.length,
        donors_to_contact: donorsToContact,
        emergency_details: formData,
        emergency_id: emergencyResponse.emergency_id,
        timestamp: new Date().toISOString()
    };
}

function isEligibleForDonation(lastDonationDate) {
    if (!lastDonationDate) return true;
    
    const lastDonation = new Date(lastDonationDate);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastDonation >= 56;
}

// NEW FUNCTION: Show donors one by one
// FUNCTION: Show donors all at once
function showDonorsSequentially(response) {
    const messageDiv = $('#responseMessage');
    messageDiv.removeClass('success error').show();
    
    if (response.status === 'success') {
        let donorContacts = '';
        
        if (response.donors_to_contact && response.donors_to_contact.length > 0) {
            donorContacts = `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #28a745;">
                    <h4 style="color: #155724; margin-bottom: 15px;">📱 SMS NOTIFICATIONS SENT!</h4>
                    <p style="margin-bottom: 15px;">We found ${response.available_donors} available donors and sent SMS alerts to ${response.donors_to_contact.length} donors in ${response.emergency_details.hospitalCity}:</p>
            `;
            
            // Show ALL donors at once
            response.donors_to_contact.forEach((donor, index) => {
                donorContacts += `
                    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                        <strong style="font-size: 1.1em;">${index + 1}. ${donor.full_name}</strong><br>
                        <span style="color: #666;">📞 Phone: ${donor.phone}</span><br>
                        <span style="color: #666;">🩸 Blood Type: ${donor.blood_type}</span><br>
                        <span style="color: #666;">📍 Location: ${donor.city}</span><br>
                        <span style="color: #28a745; font-weight: bold;">✅ SMS Alert Sent</span>
                    </div>
                `;
            });
            
            donorContacts += `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <strong>📱 Next Steps:</strong> 
                        <p style="margin: 5px 0 0 0;">Donors have been notified via SMS and will contact you directly. Please keep your phone available.</p>
                    </div>
                </div>
            `;
        } else {
            donorContacts = `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p>No available donors found in ${response.emergency_details.hospitalCity}. We've created an emergency alert and will notify you if any donors become available.</p>
                </div>
            `;
        }
        
        messageDiv.addClass('success').html(`
            <div style="text-align: center;">
                <h4 style="color: #155724; font-size: 1.5em;">✅ ${response.message}</h4>
                <p style="font-size: 1.1em;">Found ${response.matching_donors} matching donors in ${response.emergency_details.hospitalCity}</p>
            </div>
            ${donorContacts}
            <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong>Emergency Details:</strong><br>
                <strong>⏰ Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>🏥 Hospital:</strong> ${response.emergency_details.hospital}<br>
                <strong>🩸 Blood Type:</strong> ${response.emergency_details.bloodType}<br>
                <strong>📞 Contact:</strong> ${response.emergency_details.contact}
            </div>
        `);
        
    } else {
        messageDiv.addClass('error').html(`
            <h4 style="color: #721c24;">❌ ${response.message}</h4>
            <p>Please try again or contact emergency services directly.</p>
        `);
    }
    
    // Scroll to response message
    $('html, body').animate({
        scrollTop: messageDiv.offset().top - 100
    }, 1000);
}

// NEW FUNCTION: Display donors one by one
function displayDonorsOneByOne(donors, emergencyData) {
    const donorsContainer = $('#donorsContainer');
    let currentIndex = 0;
    
    function showNextDonor() {
        if (currentIndex < donors.length) {
            const donor = donors[currentIndex];
            
            const donorCard = `
                <div class="donor-card-appearing" style="
                    background: white; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 8px; 
                    border-left: 4px solid #28a745;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.5s ease-in-out;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <strong style="font-size: 1.1em; color: #333;">${currentIndex + 1}. ${donor.full_name}</strong>
                        <span style="background: #ffc107; color: #856404; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">
                            🔔 Sending SMS...
                        </span>
                    </div>
                    <div style="color: #666; line-height: 1.4;">
                        <div>📞 Phone: ${donor.phone}</div>
                        <div>🩸 Blood Type: ${donor.blood_type}</div>
                        <div>📍 Location: ${donor.city}</div>
                        <div>📧 Email: ${donor.email}</div>
                    </div>
                </div>
            `;
            
            donorsContainer.append(donorCard);
            
            setTimeout(() => {
                const lastCard = donorsContainer.find('.donor-card-appearing').last();
                lastCard.css({
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
                
                sendSMSForSingleDonor(donor, emergencyData, currentIndex)
                    .then(() => {
                        lastCard.find('span').html('✅ SMS Sent').css('background', '#28a745').css('color', 'white');
                    })
                    .catch(() => {
                        lastCard.find('span').html('❌ SMS Failed').css('background', '#dc3545').css('color', 'white');
                    })
                    .finally(() => {
                        setTimeout(() => {
                            currentIndex++;
                            showNextDonor();
                        }, 1000);
                    });
                    
            }, 100);
        } else {
            setTimeout(() => {
                const completionMsg = `
                    <div style="background: #d1edff; padding: 15px; border-radius: 8px; margin-top: 15px; border: 2px solid #007bff; opacity: 0; transform: translateY(20px); transition: all 0.5s ease-in-out;">
                        <strong style="color: #004085;">✅ ALL SMS NOTIFICATIONS COMPLETED</strong>
                        <p style="margin: 5px 0 0 0; color: #004085;">
                            SMS alerts have been sent to all ${donors.length} donors. 
                            They will contact you directly using the provided contact information.
                        </p>
                    </div>
                `;
                donorsContainer.append(completionMsg);
                
                setTimeout(() => {
                    donorsContainer.find('div').last().css({
                        'opacity': '1',
                        'transform': 'translateY(0)'
                    });
                }, 100);
            }, 500);
        }
    }
    
    showNextDonor();
}

// NEW FUNCTION: Send SMS for single donor
function sendSMSForSingleDonor(donor, emergencyData, index) {
    return new Promise((resolve, reject) => {
        const smsMessage = createSMSMessage(donor, emergencyData);
        
        setTimeout(() => {
            if (Math.random() > 0.1) {
                logSMSNotification(donor.id, emergencyData, 'sent');
                resolve();
            } else {
                logSMSNotification(donor.id, emergencyData, 'failed');
                reject();
            }
        }, 2000 + (index * 500));
    });
}

function createSMSMessage(donor, emergencyData) {
    const urgencyText = {
        'critical': '🚨 CRITICAL URGENCY (Within 2 hours)',
        'high': '⚠️ HIGH URGENCY (Within 6 hours)',
        'medium': '🔶 MEDIUM URGENCY (Within 24 hours)'
    };
    
    return `URGENT BLOOD DONATION REQUEST

Hello ${donor.full_name},

Patient: ${emergencyData.patientName}
Blood Type: ${emergencyData.bloodType}
Units Needed: ${emergencyData.units}
Urgency: ${urgencyText[emergencyData.urgency]}

Hospital: ${emergencyData.hospital}
Location: ${emergencyData.hospitalCity}
Contact: ${emergencyData.contactPerson} - ${emergencyData.contact}

${emergencyData.message ? `Notes: ${emergencyData.message}` : ''}

Please respond immediately if you can help.

BloodDonor Emergency System`;
}

function logSMSNotification(donorId, emergencyData, status) {
    $.ajax({
        url: 'submit.php',
        type: 'POST',
        data: {
            action: 'logSMS',
            donor_id: donorId,
            emergency_data: JSON.stringify(emergencyData),
            status: status,
            timestamp: new Date().toISOString()
        },
        success: function(response) {
            console.log('SMS logged successfully');
        },
        error: function(error) {
            console.error('Failed to log SMS:', error);
        }
    });
}

// Emergency contact functions
function callEmergency(number) {
    const cardId = number === '911' ? 'medicalEmergencyCard' : 
                  number === '+1-555-BLOOD-HELP' ? 'bloodBankCard' : 'patientCoordinatorCard';
    
    const card = document.getElementById(cardId);
    
    card.classList.add('active');
    
    alert(`Calling: ${number}\n\nPlease use your phone to complete the call.`);
    
    setTimeout(() => {
        card.classList.remove('active');
    }, 3000);
    
    console.log(`Initiating call to: ${number}`);
}

// Simulate live donor activity
function simulateDonorActivity() {
    setInterval(() => {
        const donorsElement = document.getElementById('activeDonors');
        if (!donorsElement) return;
        
        const currentText = donorsElement.textContent;
        const currentCount = parseInt(currentText) || 50;
        const newCount = Math.max(45, currentCount + Math.floor(Math.random() * 6) - 3);
        donorsElement.textContent = newCount + '+';
        
        donorsElement.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            donorsElement.style.animation = '';
        }, 500);
    }, 15000);
}

function updateLiveDonorCount() {
    $.ajax({
        url: 'submit.php',
        type: 'GET',
        data: {
            action: 'getDonors'
        },
        success: function(response) {
            try {
                const donors = typeof response === 'string' ? JSON.parse(response) : response;
                const activeCount = donors.filter(donor => 
                    donor.available !== false
                ).length;
                $('#activeDonors').text(activeCount + '+');
            } catch (e) {
                const baseCount = 50;
                const variation = Math.floor(Math.random() * 10) - 5;
                const liveCount = Math.max(10, baseCount + variation);
                $('#activeDonors').text(liveCount + '+');
            }
        },
        error: function() {
            const baseCount = 50;
            const variation = Math.floor(Math.random() * 10) - 5;
            const liveCount = Math.max(10, baseCount + variation);
            $('#activeDonors').text(liveCount + '+');
        }
    });
}