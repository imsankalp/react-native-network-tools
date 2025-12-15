import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { RNButton } from '../components/button/RNButton';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Tools Example</Text>
        <Text style={styles.subtitle}>
          This example app demonstrates how to use the React Native Network
          Tools library to monitor and debug network requests.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Examples</Text>

        <RNButton
          title="API Playground"
          onPress={() => navigation.navigate('ApiPlayground')}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
        />

        <RNButton
          title="Auth Flow"
          onPress={() => navigation.navigate('AuthFlow')}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
        />

        <RNButton
          title="Error Cases"
          onPress={() => navigation.navigate('ErrorCases')}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.paragraph}>
          This example app is designed to showcase various network scenarios:
        </Text>
        <Text style={styles.listItem}>• Successful requests</Text>
        <Text style={styles.listItem}>• Failed requests</Text>
        <Text style={styles.listItem}>• Delayed responses</Text>
        <Text style={styles.listItem}>• Authentication flows</Text>
        <Text style={styles.listItem}>• Error handling</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default HomeScreen;
