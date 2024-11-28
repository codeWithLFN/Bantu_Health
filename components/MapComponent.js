import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    FlatList,
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

const GOOGLE_API_KEY = 'AIzaSyAsc-PWMl_MI5iSNk9Jt61afWlZLFQ5Dmo'; // Replace with your Google API key

const REGIONS = [
    { latitude: -26.2041, longitude: 28.0473 }, // Johannesburg
    { latitude: -33.9249, longitude: 18.4241 }, // Cape Town
    { latitude: -25.7479, longitude: 28.2293 }, // Pretoria
    { latitude: -29.8587, longitude: 31.0218 }, // Durban
    { latitude: -26.1952, longitude: 28.0340 }, // Tshwane
    // Add more regions as needed
];

const MapComponent = () => {
    const [medicalFacilities, setMedicalFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [showList, setShowList] = useState(false);

    const initialRegion = {
        latitude: -30.5595,
        longitude: 22.9375,
        latitudeDelta: 10,
        longitudeDelta: 10,
    };

    const openInGoogleMaps = (facility) => {
        if (!userLocation) {
            Alert.alert('Location Required', 'Please enable location services to get directions.');
            return;
        }

        const destination = `${facility.latitude},${facility.longitude}`;
        const label = encodeURIComponent(facility.name || 'Medical Facility');

        const scheme = Platform.select({
            ios: 'comgooglemaps://',
            android: 'geo:'
        });

        const url = Platform.select({
            ios: `${scheme}?q=${label}@${destination}&directionsmode=driving`,
            android: `${scheme}0,0?q=${destination}(${label})`
        });

        const webUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                }
                return Linking.openURL(webUrl);
            })
            .catch(() => {
                Linking.openURL(webUrl);
            });
    };

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const allFacilities = [];
                const processedIds = new Set();

                for (const region of REGIONS) {
                    const hospitalUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=50000&type=hospital&key=${GOOGLE_API_KEY}`;
                    const clinicUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=50000&keyword=clinic&type=health&key=${GOOGLE_API_KEY}`;

                    const [hospitalResponse, clinicResponse] = await Promise.all([
                        fetch(hospitalUrl),
                        fetch(clinicUrl)
                    ]);

                    const [hospitalData, clinicData] = await Promise.all([
                        hospitalResponse.json(),
                        clinicResponse.json()
                    ]);

                    if (hospitalData.results) {
                        hospitalData.results.forEach((place) => {
                            if (!processedIds.has(place.place_id)) {
                                processedIds.add(place.place_id);
                                allFacilities.push({
                                    id: place.place_id,
                                    name: place.name || 'Unnamed Facility',
                                    latitude: place.geometry.location.lat,
                                    longitude: place.geometry.location.lng,
                                    address: place.vicinity || 'Address not available',
                                    type: 'hospital'
                                });
                            }
                        });
                    }

                    if (clinicData.results) {
                        clinicData.results.forEach((place) => {
                            if (!processedIds.has(place.place_id)) {
                                processedIds.add(place.place_id);
                                allFacilities.push({
                                    id: place.place_id,
                                    name: place.name || 'Unnamed Facility',
                                    latitude: place.geometry.location.lat,
                                    longitude: place.geometry.location.lng,
                                    address: place.vicinity || 'Address not available',
                                    type: 'clinic'
                                });
                            }
                        });
                    }
                }

                setMedicalFacilities(allFacilities);
            } catch (error) {
                console.error('Error fetching facilities:', error);
                setErrorMsg('Error fetching medical facilities');
            } finally {
                setLoading(false);
            }
        };

        const getUserLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation(location.coords);
            } else {
                setErrorMsg('Location permission not granted');
            }
        };

        fetchFacilities();
        getUserLocation();
    }, []);

    const renderFacilityCard = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => {
                setSelectedFacility(item);
                setShowList(false);
            }}
        >
            <View style={styles.cardHeader}>
                <MaterialIcons 
                    name={item.type === 'hospital' ? 'local-hospital' : 'medical-services'} 
                    size={24} 
                    color={item.type === 'hospital' ? '#FF4444' : '#4444FF'} 
                />
                <Text style={styles.facilityName}>{item.name}</Text>
            </View>
            <Text style={styles.facilityAddress}>{item.address}</Text>
            <TouchableOpacity
                style={styles.directionButton}
                onPress={() => openInGoogleMaps(item)}
            >
                <MaterialIcons name="directions" size={20} color="#FFFFFF" />
                <Text style={styles.directionButtonText}>Get Directions</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerText}>Medical Facilities</Text>
                    <Text style={styles.subHeaderText}>Hospitals & Clinics Near You</Text>
                </View>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                >
                    {medicalFacilities.map((facility) => (
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
                    ))}
                </MapView>

                {showList && selectedFacility && (
                    <View style={styles.facilityInfoContainer}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setShowList(false)}
                        >
                            <MaterialIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        {renderFacilityCard({ item: selectedFacility })}
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