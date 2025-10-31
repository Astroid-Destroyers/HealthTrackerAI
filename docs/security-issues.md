# Security Issues - HealthTrackerAI

## Overview
HealthTrackerAI prioritizes user data protection through secure authentication, encrypted storage, and responsible data access. Our main goal is to prevent unauthorized access or misuse of sensitive information.

## 1. Security Concerns 
- Unauthorized access to user data.
- Exposure of private information through misconfigurations or attacks.
- Potential misuse of AI generated data if accounts are compromised 

## 2. Sensitive Information and Protection 
- We store limited personal daat (name, age, weight, height, gender, and goals).
- All information is protected using **Firebase Authentication** and **Firestore Security Rules**.
- Passwords are never stored directly; Firebase securely manages authentication.
- Access to user data is restricted by user ID, and users can delete their data anytime. 

