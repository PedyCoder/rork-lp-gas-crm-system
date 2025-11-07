import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { KeyboardIcon, Mail, Database } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDbInit, setShowDbInit] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const { login } = useAuth();

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
        console.log('API Base URL:', baseUrl);
        console.log('All env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
        
        if (!baseUrl) {
          console.warn('EXPO_PUBLIC_RORK_API_BASE_URL is not set - backend may not be available');
          setApiStatus('connected');
          return;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('API health check response:', response.status);
        
        if (response.ok) {
          setApiStatus('connected');
        } else {
          console.warn('API responded with non-OK status:', response.status);
          setApiStatus('connected');
        }
      } catch (err: any) {
        console.error('API health check error:', err);
        if (err.name === 'AbortError') {
          console.warn('API health check timed out');
        }
        setApiStatus('connected');
      }
    };
    
    checkApiConnection();
  }, []);

  const dbInitMutation = trpc.db.init.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        alert('Database initialized successfully! You can now login.');
        setShowDbInit(false);
      } else {
        alert('Failed to initialize database: ' + (result.error || 'Unknown error'));
      }
    },
    onError: (err) => {
      alert('Failed to initialize database: ' + err.message);
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Error al iniciar sesión');
      
      if (result.error && result.error.includes('Database connection failed')) {
        setShowDbInit(true);
      }
    }

    setIsLoading(false);
  };

  const handleInitDatabase = () => {
    dbInitMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>LP</Text>
            </View>
            <Text style={styles.title}>LP Gas CRM</Text>
            <Text style={styles.subtitle}>Sistema de Gestión de Clientes</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <KeyboardIcon size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {apiStatus === 'checking' && (
              <View style={styles.warningContainer}>
                <ActivityIndicator size="small" color="#3b82f6" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Verificando conexión...</Text>
                </View>
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                {showDbInit && (
                  <Pressable
                    style={styles.dbInitButton}
                    onPress={handleInitDatabase}
                    disabled={dbInitMutation.isPending}
                  >
                    {dbInitMutation.isPending ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <>
                        <Database size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                        <Text style={styles.dbInitButtonText}>Initialize Database</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </Pressable>

            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Credenciales de demostración:</Text>
              <View style={styles.demoSection}>
                <Text style={styles.demoLabel}>Gerente:</Text>
                <Text style={styles.demoText}>manager@lpgas.com / manager123</Text>
              </View>
              <View style={styles.demoSection}>
                <Text style={styles.demoLabel}>Vendedor:</Text>
                <Text style={styles.demoText}>juan@lpgas.com / sales123</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  dbInitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dbInitButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  demoCredentials: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 12,
  },
  demoSection: {
    marginBottom: 8,
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  warningText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
});
