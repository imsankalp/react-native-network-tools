import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { RNButton } from '../components/button/RNButton';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: number | null;
    username: string | null;
  };
}

const AuthFlowScreen = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('1');
  const [response, setResponse] = useState<any>(null);
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: {
      id: null,
      username: null,
    },
  });

  const handleLogin = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please enter a user ID (1-10)');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Fetch user data from JSONPlaceholder
      const result = await apiClient.get(ENDPOINTS.GET_USER(Number(userId)));

      // Simulate authentication
      const mockToken = `mock-token-${result.data.id}-${Date.now()}`;

      setAuth({
        isAuthenticated: true,
        token: mockToken,
        user: {
          id: result.data.id,
          username: result.data.username,
        },
      });

      setResponse({
        status: result.status,
        data: {
          message: 'Login successful',
          user: result.data,
          token: mockToken,
        },
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      user: { id: null, username: null },
    });
    setResponse(null);
  };

  const fetchProtectedData = async () => {
    if (!auth.user.id) {
      Alert.alert('Error', 'You need to be logged in to access this');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Fetch user's todos as "protected" data
      const result = await apiClient.get(
        ENDPOINTS.GET_USER_TODOS(auth.user.id),
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setResponse({
        status: result.status,
        data: result.data,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {auth.isAuthenticated ? 'Authenticated' : 'Authentication'}
          </Text>

          {!auth.isAuthenticated ? (
            <View style={styles.authForm}>
              <Text style={styles.formLabel}>
                Enter User ID (1-10) to "login" and fetch user data:
              </Text>
              <TextInput
                style={styles.input}
                placeholder="User ID (e.g., 1)"
                value={userId}
                onChangeText={setUserId}
                keyboardType="numeric"
                editable={!loading}
              />
              <RNButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
              />
            </View>
          ) : (
            <View style={styles.authInfo}>
              <Text style={styles.userInfo}>
                Logged in as:{' '}
                <Text style={styles.userName}>{auth.user.username}</Text>
              </Text>
              <View style={styles.buttonGroup}>
                <RNButton
                  title="Get Protected Data"
                  onPress={fetchProtectedData}
                  loading={loading}
                  disabled={loading}
                  containerStyle={[
                    styles.buttonContainer,
                    styles.smallButtonContainer,
                  ]}
                  buttonStyle={styles.smallButton}
                  titleStyle={styles.buttonTitle}
                />
                <RNButton
                  title="Logout"
                  onPress={handleLogout}
                  disabled={loading}
                  containerStyle={[
                    styles.buttonContainer,
                    styles.smallButtonContainer,
                  ]}
                  buttonStyle={[styles.smallButton, styles.logoutButton]}
                  titleStyle={[styles.buttonTitle, styles.logoutButtonTitle]}
                />
              </View>
            </View>
          )}
        </View>

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>
              {response.error ? 'Error' : 'Response'}
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
    marginBottom: 16,
    color: '#333',
  },
  authForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 8,
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
  authInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  userName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  smallButton: {
    paddingVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
  logoutButtonTitle: {
    color: '#fff',
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

export default AuthFlowScreen;
