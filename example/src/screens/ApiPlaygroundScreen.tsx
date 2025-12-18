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
      title: 'Get All Posts',
      description: 'Fetch 100 posts from JSONPlaceholder',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_POSTS), 'get-posts'),
    },
    {
      title: 'Get Single Post',
      description: 'Fetch a specific post by ID',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_POST(1)), 'get-post'),
    },
    {
      title: 'Get All Users',
      description: 'Fetch all users',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_USERS), 'get-users'),
    },
    {
      title: 'Get Comments',
      description: 'Fetch all comments',
      onPress: () =>
        makeRequest(
          () => apiClient.get(ENDPOINTS.GET_COMMENTS),
          'get-comments'
        ),
    },
    {
      title: 'Get Todos',
      description: 'Fetch all todos',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_TODOS), 'get-todos'),
    },
    {
      title: 'Get Photos',
      description: 'Fetch all photos (large payload)',
      onPress: () =>
        makeRequest(() => apiClient.get(ENDPOINTS.GET_PHOTOS), 'get-photos'),
    },
    {
      title: 'Create Post',
      description: 'POST request to create a new post',
      onPress: () =>
        makeRequest(
          () =>
            apiClient.post(ENDPOINTS.CREATE_POST, {
              title: 'New Post',
              body: 'This is a test post created from the example app',
              userId: 1,
            }),
          'create-post'
        ),
    },
    {
      title: 'Update Post',
      description: 'PUT request to update a post',
      onPress: () =>
        makeRequest(
          () =>
            apiClient.put(ENDPOINTS.UPDATE_POST(1), {
              id: 1,
              title: 'Updated Post',
              body: 'This post has been updated',
              userId: 1,
            }),
          'update-post'
        ),
    },
    {
      title: 'Delete Post',
      description: 'DELETE request to remove a post',
      onPress: () =>
        makeRequest(
          () => apiClient.delete(ENDPOINTS.DELETE_POST(1)),
          'delete-post'
        ),
    },
    {
      title: 'Delayed Request (2s)',
      description: 'Simulated 2 second delay',
      onPress: () =>
        makeRequest(
          () => apiClient.get(ENDPOINTS.GET_POSTS, { delay: 2000 }),
          'delayed-request'
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
