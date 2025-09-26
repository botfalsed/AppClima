import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert, 
  FlatList,
  ActivityIndicator 
} from 'react-native';
import { WeatherContext } from '../../contexts/WeatherContext';

export default function Buscar() {
  const [city, setCity] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { 
    fetchWeatherData, 
    loading, 
    searchResults, 
    searchLoading, 
    searchCitiesData, 
    clearSearchResults 
  } = useContext(WeatherContext);

  // Buscar ciudades cuando el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (city.trim().length >= 2) {
        searchCitiesData(city.trim());
        setShowSuggestions(true);
      } else {
        clearSearchResults();
        setShowSuggestions(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [city]);

  const handleSearch = async (selectedCity?: string) => {
    const searchCity = selectedCity || city.trim();
    
    if (!searchCity) {
      Alert.alert('Error', 'Por favor ingresa el nombre de una ciudad');
      return;
    }

    try {
      await fetchWeatherData(searchCity);
      setCity('');
      setShowSuggestions(false);
      clearSearchResults();
    } catch (error) {
      Alert.alert('Error', 'No se pudo encontrar la ciudad. Verifica el nombre e intenta nuevamente.');
    }
  };

  const handleSuggestionPress = (suggestion: any) => {
    const cityName = `${suggestion.name}, ${suggestion.region}, ${suggestion.country}`;
    handleSearch(cityName);
  };

  const renderSuggestion = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleSuggestionPress(item)}
    >
      <Text style={styles.suggestionText}>
        {item.name}, {item.region}
      </Text>
      <Text style={styles.suggestionCountry}>
        {item.country}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar ciudad..."
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => handleSearch()}
          editable={!loading}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={() => handleSearch()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sugerencias de ciudades */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4A90E2" size="small" />
              <Text style={styles.loadingText}>Buscando ciudades...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults.slice(0, 5)} // Mostrar máximo 5 sugerencias
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id.toString()}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          ) : city.trim().length >= 2 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No se encontraron ciudades</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    marginVertical: 5,
    marginTop: 50,
    padding: 20,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 4, 4, 0.525)',
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#debdbd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#f5f0f0',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#40474f',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 5,
    backgroundColor: 'rgba(25, 24, 24, 0.841)',
    borderRadius: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    
  },
  suggestionText: {
    fontSize: 16,
    color: '#f6f4f4',
    fontWeight: '500',
  },
  suggestionCountry: {
    fontSize: 14,
    color: '#b1a3a3',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});