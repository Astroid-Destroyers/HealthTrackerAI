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

## 3. Possible Attack Vectors and Mitigation
- **Unauthorized Access:** Prevented through Firebase Auth and strict access control rules.  
- **XSS (Cross-Site Scripting):** Prevented by sanitizing user inputs and escaping HTML.  
- **Database Access or Modification:** Firestore permissions limit read/write access to the authenticated user only.  
- **API Misuse:** API keys are stored securely in environment variables and never exposed on the client side.
- By combining strong authentication, encrypted communication, anf least privilege data rules, HealthTrackerAI minimizes security risks and protects all user information. 

