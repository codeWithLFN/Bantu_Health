import React, { useState } from 'react';
import { 
  StatusBar, 
  TextInput, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  SafeAreaView 
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Navbar from '../components/Navbar/Navbar.js';
import { Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path as needed

const { width } = Dimensions.get('window');

const Settings = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');

  // Options available in Settings
  const options = [
    { 
      icon: "user-cog", 
      title: "Accounts Center", 
      description: "Manage password, security, personal details", 
      route: "AccountCenter" 
    },
    { icon: "info-circle", title: "About", route: "About" },
    { icon: "file-alt", title: "Privacy Policy", route: "PrivacyPolicy" },
    { icon: "file-contract", title: "Terms of Use", route: "TermsOfUse" },
  ];

  // Filter options based on search input
  const filteredOptions = options.filter(option =>
    option.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Define renderOption function
  const renderOption = ({ icon, title, description, route }) => (
    <TouchableOpacity
      key={title}
      style={styles.option}
      onPress={() => navigation.navigate(route)}>
      <Icon name={icon} size={20} color="#4B5563" style={styles.optionIcon} />
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Icon name="chevron-right" size={15} color="#4B5563" />
    </TouchableOpacity>
  );

  // Logout handler
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Reset navigation stack and navigate to Login
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show an error toast
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 80 }}>
          <Text style={styles.header}>Settings</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Render filtered options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => renderOption(option))
          ) : (
            <Text style={styles.noResultsText}>No results found</Text>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}>
            <Icon name="sign-out-alt" size={20} color="#FF6B6B" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Navbar fixed at the bottom */}
        <Navbar style={styles.navbar} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginVertical: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 20,
    backgroundColor: '#FFEBEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    width: width,
  },
});

export default Settings;