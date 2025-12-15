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
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState('password');
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
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const result = await apiClient.post(ENDPOINTS.LOGIN, {
        username,
        password,
      });

      setAuth({
        isAuthenticated: true,
        token: result.data.token,
        user: result.data.user,
      });

      setResponse({
        status: result.status,
        data: {
          message: 'Login successful',
          user: result.data.user,
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
    if (!auth.token) {
      Alert.alert('Error', 'You need to be logged in to access this');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const result = await apiClient.get(ENDPOINTS.PROTECTED, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

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
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
