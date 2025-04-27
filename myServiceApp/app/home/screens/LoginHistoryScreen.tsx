// app/(tabs)/home/screens/LoginHistoryScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { auth } from '@/firebase-config';
import { IconProps } from '@expo/vector-icons/build/createIconSet';

// Define the type for login records
interface LoginRecord {
  id: string;
  timestamp: number;  // timestamp in milliseconds
  device: string;
  ipAddress: string;
  location: string;  // e.g., "New York, USA"
  successful: boolean;
  method: 'password' | 'biometric' | 'google' | 'facebook' | 'apple';
}

const LoginHistoryScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createLoginHistoryStyles);
  
  // State variables
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchLoginHistory();
  }, []);
  
  // Function to fetch login history
  const fetchLoginHistory = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would fetch this data from your backend
      // For this example, we'll create mock data
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User is not logged in');
        setIsLoading(false);
        return;
      }
      
      // Mock data - in a real app, this would come from a server API call
      const mockHistory = generateMockLoginHistory();
      setLoginHistory(mockHistory);
    } catch (error) {
      console.log('Error fetching login history:', error);
      Alert.alert('Error', 'Failed to load login history. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Function to refresh the login history
  const onRefresh = () => {
    setRefreshing(true);
    fetchLoginHistory();
  };
  
  // Function to generate fake login history for demonstration
  const generateMockLoginHistory = (): LoginRecord[] => {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    return [
      {
        id: '1',
        timestamp: now.getTime(),
        device: 'iPhone 14 Pro',
        ipAddress: '192.168.1.1',
        location: 'New York, USA',
        successful: true,
        method: 'biometric'
      },
      {
        id: '2',
        timestamp: now.getTime() - (2 * 60 * 60 * 1000), // 2 hours ago
        device: 'iPhone 14 Pro',
        ipAddress: '192.168.1.1',
        location: 'New York, USA',
        successful: true,
        method: 'password'
      },
      {
        id: '3',
        timestamp: now.getTime() - dayInMs, // 1 day ago
        device: 'MacBook Pro',
        ipAddress: '192.168.1.5',
        location: 'New York, USA',
        successful: true,
        method: 'password'
      },
      {
        id: '4',
        timestamp: now.getTime() - (2 * dayInMs), // 2 days ago
        device: 'Unknown Device',
        ipAddress: '82.45.128.91',
        location: 'London, UK',
        successful: false,
        method: 'password'
      },
      {
        id: '5',
        timestamp: now.getTime() - (5 * dayInMs), // 5 days ago
        device: 'iPad Air',
        ipAddress: '192.168.1.7',
        location: 'New York, USA',
        successful: true,
        method: 'biometric'
      },
      {
        id: '6',
        timestamp: now.getTime() - (10 * dayInMs), // 10 days ago
        device: 'iPhone 14 Pro',
        ipAddress: '192.168.2.5',
        location: 'Boston, USA',
        successful: true,
        method: 'password'
      },
      {
        id: '7',
        timestamp: now.getTime() - (15 * dayInMs), // 15 days ago
        device: 'Android Device',
        ipAddress: '94.62.157.82',
        location: 'Madrid, Spain',
        successful: false,
        method: 'password'
      }
    ];
  };
  
  // Function to format date relative to now
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE, h:mm a'); // e.g., "Monday, 2:30 PM"
    } else {
      return format(date, 'MMM d, yyyy, h:mm a'); // e.g., "Apr 15, 2023, 2:30 PM"
    }
  };
  
  
  const getMethodIcon = (method: string): "key-outline" | "finger-print-outline" | "logo-google" | "logo-facebook" | "logo-apple" | "log-in-outline" => {
    switch (method) {
      case 'password':
        return 'key-outline';
      case 'biometric':
        return 'finger-print-outline';
      case 'google':
        return 'logo-google';
      case 'facebook':
        return 'logo-facebook';
      case 'apple':
        return 'logo-apple';
      default:
        return 'log-in-outline';
    }
  };
  
  // Group login records by date section
  const groupLoginRecords = () => {
    const today: LoginRecord[] = [];
    const yesterday: LoginRecord[] = [];
    const thisWeek: LoginRecord[] = [];
    const older: LoginRecord[] = [];
    
    loginHistory.forEach(record => {
      const date = new Date(record.timestamp);
      if (isToday(date)) {
        today.push(record);
      } else if (isYesterday(date)) {
        yesterday.push(record);
      } else if (isThisWeek(date)) {
        thisWeek.push(record);
      } else {
        older.push(record);
      }
    });
    
    return { today, yesterday, thisWeek, older };
  };
  
  // Render a single login record
  const renderLoginRecord = (record: LoginRecord) => {
    return (
      <View key={record.id} style={styles.loginRecordContainer}>
        <View style={[
          styles.statusIndicator, 
          record.successful ? styles.successIndicator : styles.failureIndicator
        ]} />
        
        <View style={styles.loginIconContainer}>
          <Ionicons 
            name={getMethodIcon(record.method)} 
            size={24}
            color={record.successful ? theme.colors.primary : theme.colors.error} 
          />
        </View>
        
        <View style={styles.loginDetails}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginDeviceText}>{record.device}</Text>
            <Text style={styles.loginTimeText}>{formatDate(record.timestamp)}</Text>
          </View>
          
          <Text style={styles.loginMethodText}>
            {record.method.charAt(0).toUpperCase() + record.method.slice(1)} login
            {!record.successful && ' attempt'}
          </Text>
          
          <View style={styles.loginLocationContainer}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.loginLocationText}>{record.location}</Text>
            <Text style={styles.loginIpText}>• {record.ipAddress}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render a section of login records with a header
  const renderLoginSection = (title: string, records: LoginRecord[]) => {
    if (records.length === 0) return null;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {records.map(renderLoginRecord)}
      </View>
    );
  };
  
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  // Group records by date
  const { today, yesterday, thisWeek, older } = groupLoginRecords();
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={styles.pageDescription}>
          Review your recent login activities. If you notice any suspicious activity, change your password immediately.
        </Text>
        
        {loginHistory.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyStateText}>No login history available</Text>
          </View>
        ) : (
          <>
            {renderLoginSection('Today', today)}
            {renderLoginSection('Yesterday', yesterday)}
            {renderLoginSection('This Week', thisWeek)}
            {renderLoginSection('Older', older)}
          </>
        )}
        
        <View style={styles.securityTipsContainer}>
          <Text style={styles.securityTipsTitle}>Security Tips</Text>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>If you see login attempts from unfamiliar locations or devices, change your password immediately.</Text>
          </View>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>Enable two-factor authentication for an additional layer of security.</Text>
          </View>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>Use biometric authentication when possible for secure and convenient access.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createLoginHistoryStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pageDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  loginRecordContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
  },
  successIndicator: {
    backgroundColor: theme.colors.success,
  },
  failureIndicator: {
    backgroundColor: theme.colors.error,
  },
  loginIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loginDetails: {
    flex: 1,
  },
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  loginDeviceText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loginTimeText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  loginMethodText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  loginLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLocationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  loginIpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  securityTipsContainer: {
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  securityTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  securityTip: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
}));

export default LoginHistoryScreen;