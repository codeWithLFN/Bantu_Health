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
    // Eastern Cape
    { latitude: -33.9258, longitude: 25.5676, name: "Port Elizabeth" },
    { latitude: -32.9699, longitude: 27.8618, name: "East London" },
    { latitude: -33.7404, longitude: 25.4124, name: "Uitenhage" },
    { latitude: -31.5595, longitude: 27.8251, name: "Queenstown" },
    { latitude: -31.5904, longitude: 29.2875, name: "Mthatha" },
    { latitude: -33.2278, longitude: 27.9167, name: "Grahamstown" },

    // Free State
    { latitude: -29.0852, longitude: 26.1596, name: "Bloemfontein" },
    { latitude: -28.3089, longitude: 27.8732, name: "Welkom" },
    { latitude: -28.5569, longitude: 25.9233, name: "Virginia" },
    { latitude: -27.6990, longitude: 27.2293, name: "Kroonstad" },
    { latitude: -28.5500, longitude: 25.9500, name: "Bethlehem" },

    // Gauteng
    { latitude: -26.2023, longitude: 28.0477, name: "Johannesburg" },
    { latitude: -25.7069, longitude: 28.2294, name: "Pretoria" },
    { latitude: -26.0667, longitude: 28.1217, name: "Midrand" },
    { latitude: -25.8546, longitude: 28.1878, name: "Centurion" },
    { latitude: -26.1952, longitude: 28.0340, name: "Tshwane" },
    { latitude: -26.3004, longitude: 27.9700, name: "Soweto" },

    // KwaZulu-Natal
    { latitude: -29.8587, longitude: 31.0218, name: "Durban" },
    { latitude: -29.6228, longitude: 30.3949, name: "Pietermaritzburg" },
    { latitude: -27.7518, longitude: 29.9300, name: "Newcastle" },
    { latitude: -28.5500, longitude: 29.7800, name: "Ladysmith" },
    { latitude: -30.2909, longitude: 30.8814, name: "Richards Bay" },

    // Limpopo
    { latitude: -23.9011, longitude: 29.4608, name: "Polokwane" },
    { latitude: -22.9736, longitude: 30.4988, name: "Thohoyandou" },
    { latitude: -22.3214, longitude: 30.4698, name: "Musina" },
    { latitude: -24.1833, longitude: 29.0167, name: "Mokopane" },
    { latitude: -23.0400, longitude: 30.2300, name: "Tzaneen" },

    // Mpumalanga
    { latitude: -25.4657, longitude: 30.9298, name: "Nelspruit" },
    { latitude: -25.3467, longitude: 30.8570, name: "White River" },
    { latitude: -25.0947, longitude: 30.8570, name: "Hazyview" },
    { latitude: -25.1196, longitude: 30.1420, name: "Sabie" },
    { latitude: -25.6282, longitude: 30.4541, name: "Barberton" },

    // North West
    { latitude: -25.6630, longitude: 25.5170, name: "Rustenburg" },
    { latitude: -25.6300, longitude: 27.7800, name: "Brits" },
    { latitude: -26.7152, longitude: 27.0916, name: "Potchefstroom" },
    { latitude: -26.8667, longitude: 26.6667, name: "Klerksdorp" },
    { latitude: -25.9300, longitude: 25.6500, name: "Mahikeng" },

    // Northern Cape
    { latitude: -28.7282, longitude: 24.7499, name: "Kimberley" },
    { latitude: -28.4478, longitude: 21.2594, name: "Upington" },
    { latitude: -29.6667, longitude: 17.8833, name: "Springbok" },
    { latitude: -28.7500, longitude: 24.7700, name: "Northern Cape" },
    { latitude: -30.7500, longitude: 22.0500, name: "Calvinia" },

    // Western Cape
    { latitude: -33.9249, longitude: 18.4241, name: "Cape Town" },
    { latitude: -33.9336, longitude: 18.8653, name: "Stellenbosch" },
    { latitude: -33.7341, longitude: 18.9700, name: "Paarl" },
    { latitude: -34.0817, longitude: 22.1409, name: "Mossel Bay" },
    { latitude: -33.6112, longitude: 19.4572, name: "Worcester" }
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