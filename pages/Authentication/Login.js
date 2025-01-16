import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize Google OAuth authentication request using Expo's Google provider
  // Returns request object, response object, and promptAsync function for triggering the auth flow
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID from environment variables
  });

  useEffect(() => {
    // Check if Google OAuth response was successful
    if (response?.type === 'success') {
      // Extract authentication object from response
      const { authentication } = response;
      // Call handleGoogleSignIn with the ID token to complete Firebase authentication
      handleGoogleSignIn(authentication.idToken);
    }
  }, [response]); // Re-run effect when response changes
  const handleGoogleSignIn = async (idToken) => {
    try {
      // Show loading indicator
      setLoading(true);
      
      // Create Google credential using the ID token
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase with the Google credential
      const userCredential = await signInWithCredential(auth, credential);
      
      // Get Firestore instance and reference to user document
      const db = getFirestore();
      const userRef = doc(db, "users", userCredential.user.uid);
      
      // Save or update user data in Firestore
      await setDoc(userRef, {
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        healthCredits: 5,
      }, { merge: true });

      // Show success message and navigate to Dashboard
      showToast("Google sign-in successful");
      navigation.navigate("Dashboard");
    } catch (error) {
      // Log and display error message if sign-in fails
      console.error("Google Sign-In Error:", error);
      showToast("Google sign-in failed");
    } finally {
      // Hide loading indicator
      setLoading(false);
    }
  };
  const handleGoogleSignInPress = async () => {
    try {
      // Trigger the Google OAuth authentication flow using promptAsync
      await promptAsync();
    } catch (error) {
      // Log any errors that occur during the sign-in prompt
      console.error("Google Sign-In Prompt Error:", error);
      // Display error message to user
      showToast("Failed to initiate Google sign-in");
    }
  };
  const handleLogin = async () => {
    // Validate that both email and password fields are filled
    if (!email || !password) {
      showToast("Please enter both email and password");
      return;
    }

    // Show loading indicator while attempting login
    setLoading(true);
    try {
      // Attempt to sign in user with email and password using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Navigate to Dashboard on successful login
      navigation.navigate("Dashboard");
    } catch (error) {
      // Show error message if login fails
      showToast("Login failed! Please check your credentials.");
    } finally {
      // Hide loading indicator regardless of success or failure
      setLoading(false);
    }
  };
  // Function to display toast notifications to the user
  const showToast = (message) => {
    Toast.show({
      text1: message,          // Main message text to display
      position: "bottom",      // Position of the toast on screen
      type: "success",         // Type/style of the toast
      visibilityTime: 4000,   // Duration to show toast (in milliseconds)
      autoHide: true,         // Automatically hide the toast
      topOffset: 30,          // Offset from the top of the screen
    });
  };

  return (
    // Main container view
    <View style={styles.container}>
      {/* Header section with logo and welcome text */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="medical-bag" size={50} color="#007BFF" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {/* Form section containing input fields and buttons */}
      <View style={styles.form}>
        {/* Email input field */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password input field with show/hide toggle */}
        <View style={styles.passwordContainer}>
          <MaterialCommunityIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          {/* Toggle password visibility button */}
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot password link */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Main login button with loading state */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider with "OR" text */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Google sign-in button */}
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignInPress}
          disabled={!request}
        >
          <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Registration link */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  forgotPassword: {
    color: '#007BFF',
    textAlign: 'right',
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  registerText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  registerLink: {
    color: '#007BFF',
    fontWeight: 'bold',
  }
});

export default Login;