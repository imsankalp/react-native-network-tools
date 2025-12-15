import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { RNButton } from '../components/button/RNButton';

interface ApiResponse {
  data?: any;
  error?: string;
  status?: number;
}

const ApiPlaygroundScreen = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse>({});
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  const makeRequest = async (
    requestFn: () => Promise<any>,
    requestName: string
  ) => {
    setLoading(true);
    setActiveRequest(requestName);
    setResponse({});

    try {
      const result = await requestFn();
      setResponse({
        data: result.data,
        status: result.status,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
      setActiveRequest(null);
    }
  };

  const requestButtons = [
    {
      title: 'Basic GET Request',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_POSTS), 'basic-get'),
    },
    {
      title: 'Delayed Response (2s)',
      onPress: () =>
        makeRequest(
          () => apiClient.get(ENDPOINTS.withDelay(ENDPOINTS.GET_POSTS, 2000)),
          'delayed-get'
        ),
    },
    {
      title: 'Error Response (500)',
      onPress: () =>
        makeRequest(
          () => apiClient.get(ENDPOINTS.withStatus(ENDPOINTS.GET_POSTS, 500)),
          'error-500'
        ),
    },
    {
      title: 'Large Payload',
      onPress: () =>
        makeRequest(
          () => apiClient.get(ENDPOINTS.withLargePayload(ENDPOINTS.GET_POSTS)),
          'large-payload'
        ),
    },
    {
      title: 'POST Request',
      onPress: () =>
        makeRequest(
          () =>
            apiClient.post(ENDPOINTS.LOGIN, {
              username: 'user1',
              password: 'password',
            }),
          'post-request'
        ),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Request Examples</Text>
          <Text style={styles.description}>
            Tap on any button below to make different types of API requests. The
            response will be displayed at the bottom of the screen.
          </Text>

          {requestButtons.map((button, index) => (
            <RNButton
              key={index}
              title={button.title}
              onPress={button.onPress}
              disabled={loading}
              loading={
                loading &&
                activeRequest ===
                  button.title.toLowerCase().replace(/\s+/g, '-')
              }
              containerStyle={styles.buttonContainer}
              buttonStyle={styles.button}
              titleStyle={styles.buttonTitle}
            />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Making request: {activeRequest}
            </Text>
          </View>
        )}

        {!loading && (response.data || response.error) && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>
              {response.error ? 'Error Response' : 'Success Response'}
              {response.status && ` (${response.status})`}
            </Text>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>
                {JSON.stringify(response.data || response.error, null, 2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
  responseContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  responseBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  responseText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
  },
});

export default ApiPlaygroundScreen;
