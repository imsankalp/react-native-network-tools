import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { RNButton } from '../components/button/RNButton';

interface ErrorCase {
  title: string;
  description: string;
  action: () => Promise<void>;
}

const ErrorCasesScreen = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    type: string;
    status?: number;
    data?: any;
    error?: string;
  } | null>(null);

  const handleError = (error: any, type: string) => {
    setResponse({
      type,
      status: error.response?.status,
      error: error.message,
      data: error.response?.data,
    });
  };

  const errorCases: ErrorCase[] = [
    {
      title: 'Network Timeout',
      description: 'Simulate a request that times out',
      action: async () => {
        setLoading('timeout');
        setResponse(null);
        try {
          // Using a very short timeout to force a timeout error
          const result = await apiClient.get(ENDPOINTS.GET_POSTS, {
            timeout: 1,
          });
          setResponse({
            type: 'timeout',
            status: result.status,
            data: result.data,
          });
        } catch (error: any) {
          handleError(error, 'timeout');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      title: 'Network Error',
      description: 'Simulate being offline',
      action: async () => {
        setLoading('network-error');
        setResponse(null);
        try {
          // Using an invalid URL to simulate network error
          await apiClient.get('http://thisurldoesnotexist.xyz');
        } catch (error: any) {
          handleError(error, 'network-error');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      title: 'Invalid JSON Response',
      description: 'Server returns invalid JSON',
      action: async () => {
        setLoading('invalid-json');
        setResponse(null);
        try {
          // This will cause a JSON parse error
          await apiClient.get('https://httpbin.org/bytes/20');
        } catch (error: any) {
          handleError(error, 'invalid-json');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      title: '4xx Error',
      description: 'Client error (e.g., 404 Not Found)',
      action: async () => {
        setLoading('client-error');
        setResponse(null);
        try {
          await apiClient.get('https://httpbin.org/status/404');
        } catch (error: any) {
          handleError(error, 'client-error');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      title: '5xx Error',
      description: 'Server error (e.g., 500 Internal Server Error)',
      action: async () => {
        setLoading('server-error');
        setResponse(null);
        try {
          await apiClient.get('https://httpbin.org/status/500');
        } catch (error: any) {
          handleError(error, 'server-error');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      title: 'Request Cancellation',
      description: 'Cancel a request after it has been sent',
      action: async () => {
        setLoading('cancellation');
        setResponse(null);

        const CancelToken = require('axios').CancelToken;
        const source = CancelToken.source();

        // Set a timeout to cancel the request
        setTimeout(() => {
          source.cancel('Request cancelled by user');
        }, 500);

        try {
          await apiClient.get(ENDPOINTS.withDelay(ENDPOINTS.GET_POSTS, 2000), {
            cancelToken: source.token,
          });
        } catch (error: any) {
          if (require('axios').isCancel(error)) {
            setResponse({
              type: 'cancellation',
              error: error.message,
            });
          } else {
            handleError(error, 'cancellation');
          }
        } finally {
          setLoading(null);
        }
      },
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Case Examples</Text>
          <Text style={styles.description}>
            These examples demonstrate how the network logger handles various
            error scenarios. Try each one to see how different types of errors
            are captured and displayed.
          </Text>

          {errorCases.map((errorCase, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{errorCase.title}</Text>
              <Text style={styles.cardDescription}>
                {errorCase.description}
              </Text>
              <RNButton
                title={
                  loading === errorCase.title.toLowerCase().replace(/\s+/g, '-')
                    ? 'Testing...'
                    : 'Test This Case'
                }
                onPress={errorCase.action}
                disabled={!!loading}
                loading={
                  loading === errorCase.title.toLowerCase().replace(/\s+/g, '-')
                }
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
                titleStyle={styles.buttonTitle}
              />
            </View>
          ))}
        </View>

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>
              {response.error ? 'Error' : 'Response'} - {response.type}
              {response.status && ` (${response.status})`}
            </Text>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>
                {response.error && `Error: ${response.error}\n\n`}
                {response.data &&
                  `Data: ${JSON.stringify(response.data, null, 2)}`}
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
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 10,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '600',
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

export default ErrorCasesScreen;
