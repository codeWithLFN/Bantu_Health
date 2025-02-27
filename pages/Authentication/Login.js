import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Initialize Google sign-in
WebBrowser.maybeCompleteAuthSession();

// Define the Login component
const Login = ({ navigation }) => {
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Define Google sign-in request first since it's used by useEffect
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: '39135274804-5gtodrsh00h1prfc6qtdlojs3ukeaa2n.apps.googleusercontent.com',
    webClientId: '39135274804-5gtodrsh00h1prfc6qtdlojs3ukeaa2n.apps.googleusercontent.com',
    redirectUri: 'exp://192.168.18.93:8081'
  });

  // Function to show a toast message
  const showToast = (message) => {
    Toast.show({
      text1: message,
      position: "bottom",
      type: "success",
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 30,
    });
  };

  // Function to handle Google sign-in
  const handleGoogleSignIn = async (idToken) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      const db = getFirestore();
      const userRef = doc(db, "users", userCredential.user.uid);
      
      await setDoc(userRef, {
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        healthCredits: 5,
      }, { merge: true });

      showToast("Google sign-in successful");
      navigation.navigate("Dashboard");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      showToast("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In request
  const handleGoogleSignInPress = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Error starting Google Sign-In flow:", error);
      showToast("Failed to start Google sign-in");
    }
  };

  // Handle Google Sign-In response
  const handleLogin = async () => {
    // Check if the user exists with the given email
    if (isEmailLogin) {
      if (!email || !password) {
        showToast("Please enter both email and password");
        return;
      }
    } else {
      // Phone number login
      if (!phoneNumber || !password) {
        showToast("Please enter both phone number and password");
        return;
      }
    }

    // Login with email and password
    setLoading(true);
    try {
      // Sign in with email and password
      let userCredential;
      if (isEmailLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Check if the user exists with the given phone number
        const db = getFirestore();
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("cellphone", "==", phoneNumber));
        const querySnapshot = await getDocs(q);
        
        // If no user found with the phone number, throw an error
        if (querySnapshot.empty) {
          throw new Error("No user found with this phone number");
        }
        
        // If user found, sign in with email and password
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
      }
      showToast("Login successful!");
      navigation.navigate("Dashboard");
    } catch (error) {
      showToast(error.message || "Login failed! Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication.idToken);
    }
  }, [response]);

  // Render the login form
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="medical-bag" size={50} color="#007BFF" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.loginTypeToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, isEmailLogin && styles.activeToggleButton]} 
            onPress={() => setIsEmailLogin(true)}
          >
            <Text style={[styles.toggleText, isEmailLogin && styles.activeToggleText]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, !isEmailLogin && styles.activeToggleButton]}
            onPress={() => setIsEmailLogin(false)}
          >
            <Text style={[styles.toggleText, !isEmailLogin && styles.activeToggleText]}>Phone</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons 
            name={isEmailLogin ? "email" : "phone"} 
            size={20} 
            color="#666" 
            style={styles.inputIcon} 
          />
          <TextInput
            style={styles.input}
            placeholder={isEmailLogin ? "Email" : "Phone Number"}
            value={isEmailLogin ? email : phoneNumber}
            onChangeText={isEmailLogin ? setEmail : setPhoneNumber}
            keyboardType={isEmailLogin ? "email-address" : "phone-pad"}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.passwordContainer}>
          <MaterialCommunityIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
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

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

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

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignInPress}
          disabled={!request}
        >
          <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  loginTypeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeToggleButton: {
    backgroundColor: '#007BFF',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold',
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
  forgotPassword: {
    color: '#007BFF',
    textAlign: 'right',
    marginBottom: 20,
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
  },
});

export default Login;