import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from './AuthContext';

type RootStackParamList = {
  Login: undefined;
  ModuleSelector: undefined;
  Dashboard: { moduleType: string };
  Camera: undefined;
};

export default function ModuleSelectorScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      // Fetch dynamic feature flags from the Next.js server (use 10.0.2.2 for Android emulator)
      fetch(`http://10.0.2.2:3000/api/auth/me?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
           setAllowedModules(data.allowedModules || []);
           setLoading(false);
        })
        .catch(err => {
           console.error('Failed to fetch modules', err);
           setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSelect = (moduleType: string) => {
    navigation.navigate('Dashboard', { moduleType });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Platform</Text>
        <Text style={styles.subtitle}>Select an inspection module</Text>
      </View>

      <View style={styles.grid}>
        {allowedModules.includes('FIRE_DOOR') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('FIRE_DOOR')}>
            <Text style={styles.icon}>🚪</Text>
            <Text style={styles.cardTitle}>Fire Doors</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('FIRE_STOPPING') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('FIRE_STOPPING')}>
            <Text style={styles.icon}>🧱</Text>
            <Text style={styles.cardTitle}>Fire Stopping</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('FRA') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('FRA')}>
            <Text style={styles.icon}>📋</Text>
            <Text style={styles.cardTitle}>Risk (FRA)</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('HHSRS') && (
          <TouchableOpacity style={[styles.card, styles.hhsrsCard]} onPress={() => handleSelect('HHSRS')}>
            <Text style={styles.icon}>🏠</Text>
            <Text style={styles.cardTitle}>HHSRS</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('LEGIONELLA') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('LEGIONELLA')}>
            <Text style={styles.icon}>💧</Text>
            <Text style={styles.cardTitle}>Legionella</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('DECENT_HOMES') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('DECENT_HOMES')}>
            <Text style={styles.icon}>✨</Text>
            <Text style={styles.cardTitle}>Decent Homes</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('PLANNED_MAINTENANCE') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('PLANNED_MAINTENANCE')}>
            <Text style={styles.icon}>📅</Text>
            <Text style={styles.cardTitle}>Maintenance</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('DAMP_MOULD') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('DAMP_MOULD')}>
            <Text style={styles.icon}>🍄</Text>
            <Text style={styles.cardTitle}>Damp & Mould</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('ASBESTOS') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('ASBESTOS')}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.cardTitle}>Asbestos</Text>
          </TouchableOpacity>
        )}

        {allowedModules.includes('STOCK_CONDITION') && (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect('STOCK_CONDITION')}>
            <Text style={styles.icon}>📊</Text>
            <Text style={styles.cardTitle}>Stock Condition</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    padding: 24,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginTop: 8,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  hhsrsCard: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
