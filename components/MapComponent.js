import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Platform,
    Alert,
    SafeAreaView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const GOOGLE_API_KEY = 'AIzaSyAsc-PWMl_MI5iSNk9Jt61afWlZLFQ5Dmo';
const SEARCH_RADIUS = 10000; // 10km radius for initial search

const MapComponent = () => {
    const [medicalFacilities, setMedicalFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [showList, setShowList] = useState(false);
    const [mapRegion, setMapRegion] = useState(null);

    // Function to fetch facilities based on location
    const fetchNearbyFacilities = useCallback(async (latitude, longitude) => {
        try {
            const processedIds = new Set();
            const facilities = [];

            // Single API call combining both hospitals and health facilities
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${SEARCH_RADIUS}&type=hospital|health&key=${GOOGLE_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.results) {
                data.results.forEach((place) => {
                    if (!processedIds.has(place.place_id)) {
                        processedIds.add(place.place_id);
                        facilities.push({
                            id: place.place_id,
                            name: place.name || 'Unnamed Facility',
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                            address: place.vicinity || 'Address not available',
                            type: place.types.includes('hospital') ? 'hospital' : 'clinic'
                        });
                    }
                });
            }

            setMedicalFacilities(facilities);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            setErrorMsg('Error fetching medical facilities');
            setLoading(false);
        }
    }, []);

    // Initialize location and map
    useEffect(() => {
        const initializeLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Location permission not granted');
                    return;
                }

                // Use low accuracy for faster initial position
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                const region = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                };

                setUserLocation(location.coords);
                setMapRegion(region);
                
                // Fetch facilities near user location
                await fetchNearbyFacilities(location.coords.latitude, location.coords.longitude);
            } catch (error) {
                console.error('Error getting location:', error);
                setErrorMsg('Error getting your location');
                setLoading(false);
            }
        };

        initializeLocation();
    }, [fetchNearbyFacilities]);

    // Memoize markers to prevent unnecessary re-renders
    const facilityMarkers = useMemo(() => 
        medicalFacilities.map((facility) => (
            <Marker
                key={facility.id}
                coordinate={{
                    latitude: facility.latitude,
                    longitude: facility.longitude
                }}
                onPress={() => {
                    setSelectedFacility(facility);
                    setShowList(true);
                }}
            >
                <MaterialIcons 
                    name={facility.type === 'hospital' ? 'local-hospital' : 'medical-services'} 
                    size={24} 
                    color={facility.type === 'hospital' ? '#FF4444' : '#4444FF'} 
                />
            </Marker>
        )),
        [medicalFacilities]
    );

    // Handle map region change
    const onRegionChangeComplete = useCallback(async (region) => {
        // Only fetch new facilities if the user has moved significantly
        if (
            userLocation && 
            (Math.abs(region.latitude - userLocation.latitude) > 0.05 ||
             Math.abs(region.longitude - userLocation.longitude) > 0.05)
        ) {
            await fetchNearbyFacilities(region.latitude, region.longitude);
        }
    }, [userLocation, fetchNearbyFacilities]);

    const openInGoogleMaps = useCallback((facility) => {
        if (!userLocation) {
            Alert.alert('Location Required', 'Please enable location services to get directions.');
            return;
        }

        const destination = `${facility.latitude},${facility.longitude}`;
        const label = encodeURIComponent(facility.name || 'Medical Facility');
        const scheme = Platform.select({ ios: 'comgooglemaps://', android: 'geo:' });
        const url = Platform.select({
            ios: `${scheme}?q=${label}@${destination}&directionsmode=driving`,
            android: `${scheme}0,0?q=${destination}(${label})`
        });
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) return Linking.openURL(url);
                return Linking.openURL(webUrl);
            })
            .catch(() => Linking.openURL(webUrl));
    }, [userLocation]);

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerText}>Medical Facilities</Text>
                    <Text style={styles.subHeaderText}>Hospitals & Clinics Near You</Text>
                </View>
                {mapRegion && (
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={mapRegion}
                        showsUserLocation={true}
                        onRegionChangeComplete={onRegionChangeComplete}
                    >
                        {facilityMarkers}
                    </MapView>
                )}

                {showList && selectedFacility && (
                    <View style={styles.facilityInfoContainer}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setShowList(false)}
                        >
                            <MaterialIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons 
                                    name={selectedFacility.type === 'hospital' ? 'local-hospital' : 'medical-services'} 
                                    size={24} 
                                    color={selectedFacility.type === 'hospital' ? '#FF4444' : '#4444FF'} 
                                />
                                <Text style={styles.facilityName}>{selectedFacility.name}</Text>
                            </View>
                            <Text style={styles.facilityAddress}>{selectedFacility.address}</Text>
                            <TouchableOpacity
                                style={styles.directionButton}
                                onPress={() => openInGoogleMaps(selectedFacility)}
                            >
                                <MaterialIcons name="directions" size={20} color="#FFFFFF" />
                                <Text style={styles.directionButtonText}>Get Directions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.loadingText}>Finding nearby medical facilities...</Text>
                    </View>
                )}

                {errorMsg && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error" size={24} color="#FF4444" />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        
    },
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    headerContainer: {
        backgroundColor: '#007BFF',
        padding: 15,
        alignItems: 'center',
        zIndex: 1,
        elevation: 3,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    subHeaderText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 5,
        opacity: 0.9,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    facilityName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    facilityAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    directionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    directionButtonText: {
        color: '#FFFFFF',
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 16,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#FFE5E5',
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        marginLeft: 10,
        color: '#FF4444',
        fontSize: 14,
        flex: 1,
    },
    facilityInfoContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '40%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 1,
        padding: 8,
    },
});

export default MapComponent;