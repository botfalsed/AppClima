import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Importar todos los componentes de funciones avanzadas
import Alertas from '@/components/clima/alertas';
import Vestimenta from '@/components/clima/vestimenta';
import IndiceUV from '@/components/clima/indiceUV';
import CalidadAire from '@/components/clima/calidadAire';
import ConfiguracionNotificaciones from '@/components/clima/configuracionNotificaciones';
import SensacionTermica from '@/components/clima/sensacionTermica';

type FeatureType = 'alertas' | 'vestimenta' | 'uv' | 'aire' | 'termica' | 'notificaciones' | null;

interface Feature {
  id: FeatureType;
  title: string;
  description: string;
  icon: string;
  color: string;
  component?: React.ComponentType;
  available: boolean;
}

export default function TabTwoScreen() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const features: Feature[] = [
    {
      id: 'alertas',
      title: 'Alertas Personalizadas',
      description: 'Configura notificaciones para lluvia, temperatura extrema y más',
      icon: 'bell.fill',
      color: '#FF6B6B',
      component: Alertas,
      available: true,
    },
    {
      id: 'vestimenta',
      title: 'Qué Vestir',
      description: 'Sugerencias de ropa basadas en el clima actual',
      icon: 'tshirt.fill',
      color: '#4ECDC4',
      component: Vestimenta,
      available: true,
    },
    {
      id: 'uv',
      title: 'Protección Solar',
      description: 'Índice UV y consejos de protección solar',
      icon: 'sun.max.fill',
      color: '#FFD93D',
      component: IndiceUV,
      available: true,
    },
    {
      id: 'aire',
      title: 'Calidad del Aire',
      description: 'Niveles de contaminación y recomendaciones de salud',
      icon: 'leaf.fill',
      color: '#6BCF7F',
      component: CalidadAire,
      available: true,
    },
    {
      id: 'notificaciones',
      title: 'Configurar Notificaciones',
      description: 'Personaliza alertas y notificaciones push',
      icon: 'gear',
      color: '#8E44AD',
      component: ConfiguracionNotificaciones,
      available: true,
    },
    {
      id: 'termica',
      title: 'Sensación Térmica',
      description: 'Calcula cómo se siente realmente la temperatura',
      icon: 'thermometer',
      color: '#FF8A65',
      component: SensacionTermica,
      available: true,
    },

  ];

  const handleFeaturePress = (feature: Feature) => {
    if (!feature.available) {
      Alert.alert(
        'Próximamente',
        `La funcionalidad ${feature.title} estará disponible en una próxima actualización.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (feature.component) {
      setSelectedFeature(feature.id);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedFeature(null);
  };

  const renderFeatureComponent = () => {
    const feature = features.find(f => f.id === selectedFeature);
    if (!feature || !feature.component) return null;

    const Component = feature.component;
    return <Component />;
  };

  const getFeatureStats = () => {
    const available = features.filter(f => f.available).length;
    const total = features.length;
    return { available, total };
  };

  const stats = getFeatureStats();

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.title}> Funciones Avanzadas</Text>
          <Text style={styles.subtitle}>Herramientas inteligentes para el clima</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.available}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Funciones Disponibles</Text>
          
          {features.map((feature) => (
            <TouchableOpacity 
              key={feature.id}
              style={[
                styles.featureCard,
                !feature.available && styles.featureCardDisabled
              ]}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <IconSymbol size={32} name={feature.icon} color={feature.color} />
              </View>
              
              <View style={styles.featureContent}>
                <View style={styles.featureTitleContainer}>
                  <Text style={[
                    styles.featureTitle,
                    !feature.available && styles.featureTitleDisabled
                  ]}>
                    {feature.title}
                  </Text>
                  {feature.available && (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>✓</Text>
                    </View>
                  )}
                  {!feature.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonBadgeText}>Próximamente</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.featureDescription,
                  !feature.available && styles.featureDescriptionDisabled
                ]}>
                  {feature.description}
                </Text>
              </View>
              
              <IconSymbol 
                size={20} 
                name={feature.available ? "chevron.right" : "clock"} 
                color={feature.available ? "#999" : "#ccc"} 
              />
            </TouchableOpacity>
          ))}

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <IconSymbol name="info.circle.fill" size={24} color="#4A90E2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Datos en Tiempo Real</Text>
                <Text style={styles.infoText}>
                  Todas las funciones utilizan datos meteorológicos actualizados de APIs profesionales.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <IconSymbol name="location.fill" size={24} color="#50C878" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Geolocalización</Text>
                <Text style={styles.infoText}>
                  Usa tu ubicación actual o selecciona cualquier ciudad del mundo.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <IconSymbol name="bell.badge.fill" size={24} color="#FF6B6B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Notificaciones Inteligentes</Text>
                <Text style={styles.infoText}>
                  Recibe alertas personalizadas basadas en tus preferencias y ubicación.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para mostrar componentes */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <IconSymbol name="xmark" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {features.find(f => f.id === selectedFeature)?.title || ''}
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            {renderFeatureComponent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000e2',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.086)',
    paddingTop: 100,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
  scrollView: {
    flex: 1,
    marginTop: 215,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(70, 44, 44, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 4,
  },
  featuresContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  featureTitleDisabled: {
    color: '#666666',
  },
  featureDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  featureDescriptionDisabled: {
    color: '#666666',
  },
  availableBadge: {
    backgroundColor: '#50C878',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  availableBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  comingSoonBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000b8',
    marginTop:0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.636)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
   
  },
});