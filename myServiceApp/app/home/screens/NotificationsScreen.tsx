// app/(tabs)/home/screens/NotificationsScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/firebase-config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';

// Define Job type
interface TaskerInfo {
  name: string;
  image: string | null;
}

interface ClientInfo {
  name: string;
  image: string | null;
}

interface Job {
  id: string;
  taskerId: string;
  clientId: string;
  date: string;
  status: string;
  amount?: number;
  notes?: string;
  paymentStatus?: string;
  taskerInfo?: TaskerInfo | null;
  clientInfo?: ClientInfo | null;
  [key: string]: any;
}

const STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  in_progress: 'In Progress',
  pending_payment: 'Awaiting Payment',
  in_escrow: 'Payment in Escrow',
  paid: 'Paid',
  completed: 'Completed',
  payment_failed: 'Payment Failed',
  rejected: 'Rejected',
};

const STATUS_ICONS = {
  pending_approval: 'hourglass-outline',
  in_progress: 'play-circle-outline',
  pending_payment: 'cash-outline',
  in_escrow: 'lock-closed-outline',
  paid: 'checkmark-circle-outline',
  completed: 'checkmark-done-circle-outline',
  payment_failed: 'close-circle-outline',
  rejected: 'close-circle-outline',
};

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [isTasker, setIsTasker] = useState(false);
  const [activeView, setActiveView] = useState<'client' | 'tasker'>('client');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // This effect checks if the user has a tasker profile
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const taskerDocRef = doc(db, 'taskers', user.uid);
        const taskerDocSnap = await getDoc(taskerDocRef);
        if (taskerDocSnap.exists()) {
          setIsTasker(true);
        }
      }
    };
    checkUserRole();
  }, []);

  useEffect(() => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    let q;
    if (activeView === 'tasker') {
      q = query(
        collection(db, 'jobs'),
        where('taskerId', '==', user.uid),
        where('status', 'in', ['pending_approval', 'in_escrow', 'processing_payment'])
      );
    } else {
      q = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid)
      );
    }

    const unsubscribe = onSnapshot(q, async (jobsSnap) => {
      let jobsData: Job[] = [];
      for (const jobDoc of jobsSnap.docs) {
        const job = jobDoc.data() as Job;
        let taskerInfo = null;
        let clientInfo = null;
        if (activeView === 'tasker' && job.clientId) {
          const clientDocSnap = await getDoc(doc(db, 'users', job.clientId));
          if (clientDocSnap.exists()) {
            const c = clientDocSnap.data();
            clientInfo = {
              name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.displayName || 'Client',
              image: c.photoURL || null,
            };
          }
        }
        if (activeView === 'client' && job.taskerId) {
          const taskerSnap = await getDoc(doc(db, 'taskers', job.taskerId));
          if (taskerSnap.exists()) {
            const t = taskerSnap.data();
            taskerInfo = { name: `${t.firstName || ''} ${t.lastName || ''}`.trim(), image: t.profileImageBase64 || t.profileImage || null };
          }
        }
        jobsData.push({ ...job, id: jobDoc.id, taskerInfo, clientInfo });
      }
      jobsData = jobsData.filter(j => !!j.date);
      jobsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeView]);

  const handleUpdateRequest = async (jobId: string, newStatus: 'in_progress' | 'rejected') => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status: newStatus });
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      Alert.alert('Success', `Booking has been ${newStatus === 'in_progress' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error(`Error updating booking status:`, error);
      Alert.alert('Error', 'Failed to update the booking. Please try again.');
    }
  };

  const handleRejectJob = async (job: Job) => {
    Alert.alert(
      'Reject Booking',
      'Please select a reason for rejecting this booking:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unavailable',
          onPress: () => rejectJobWithReason(job.id, 'unavailable', 'I am not available at this time')
        },
        {
          text: 'Location Too Far',
          onPress: () => rejectJobWithReason(job.id, 'location', 'The location is too far from my service area')
        },
        {
          text: 'Insufficient Details',
          onPress: () => rejectJobWithReason(job.id, 'details', 'I need more details about the job requirements')
        },
        {
          text: 'Other',
          onPress: () => rejectJobWithReason(job.id, 'other', 'Other reason')
        }
      ]
    );
  };

  const rejectJobWithReason = async (jobId: string, reason: string, reasonText: string) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'rejected',
        rejectionReason: reason,
        rejectionReasonText: reasonText,
        rejectedAt: new Date()
      });
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      Alert.alert('Success', 'Booking has been rejected.');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert('Error', 'Failed to reject the booking. Please try again.');
    }
  };

  const renderActionButton = (job: Job) => {
    // Show next action based on status
    if (job.status === 'pending_approval') {
      return (
        <View style={styles.actionButtonDisabled}>
          <Ionicons name="hourglass-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.actionButtonText}>Waiting for Tasker Approval</Text>
        </View>
      );
    }
    if (job.status === 'in_progress') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/home/screens/JobStatusScreen', params: { jobId: job.id } })}
        >
          <Ionicons name="cash-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonTextWhite}>Pay Now</Text>
        </TouchableOpacity>
      );
    }
    if (job.status === 'in_escrow') {
      return (
        <View style={styles.actionButtonDisabled}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.actionButtonText}>Payment in Escrow</Text>
        </View>
      );
    }
    if (job.status === 'paid') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/home/screens/RateTaskerScreen', params: { jobId: job.id } })}
        >
          <Ionicons name="star-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonTextWhite}>Rate Tasker</Text>
        </TouchableOpacity>
      );
    }
    if (job.status === 'completed') {
      return (
        <View style={styles.actionButtonDisabled}>
          <Ionicons name="checkmark-done-circle-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.actionButtonText}>Completed</Text>
        </View>
      );
    }
    if (job.status === 'payment_failed') {
      return (
        <View style={styles.actionButtonDisabled}>
          <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Payment Failed</Text>
        </View>
      );
    }
    if (job.status === 'rejected') {
      return (
        <View style={styles.actionButtonDisabled}>
          <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Rejected</Text>
        </View>
      );
    }
    return null;
  };

  const renderViewSwitcher = () => {
    if (!isTasker) return null;
    return (
      <View style={styles.switcherContainer}>
        <TouchableOpacity
          style={[styles.switcherButton, activeView === 'client' && styles.switcherButtonActive]}
          onPress={() => setActiveView('client')}
        >
          <Ionicons name="briefcase-outline" size={18} color={activeView === 'client' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.switcherText, activeView === 'client' && styles.switcherTextActive]}>My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherButton, activeView === 'tasker' && styles.switcherButtonActive]}
          onPress={() => setActiveView('tasker')}
        >
          <Ionicons name="notifications-outline" size={18} color={activeView === 'tasker' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.switcherText, activeView === 'tasker' && styles.switcherTextActive]}>Job Requests</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTaskerContent = () => (
    <>
      <Text style={styles.title}>New Booking Requests</Text>
      <Text style={styles.subtitle}>Review and respond to new job requests from clients.</Text>
      <FlatList<Job>
        data={jobs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: '/home/screens/JobStatusScreen',
              params: {
                jobId: item.id,
                viewMode: 'tasker' // Add view mode to distinguish tasker view
              }
            })}
          >
            <View style={styles.taskerCardContent}>
              <View style={styles.clientInfoSection}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Ionicons name="person" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientName}>{item.clientInfo?.name || 'A Client'}</Text>
                    <Text style={styles.clientLocation}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.textLight} />
                      {' '}{item.address || 'Location not specified'}
                    </Text>
                  </View>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textLight} />
                    <Text style={styles.detailText}>
                      {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {item.amount && (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag-outline" size={16} color={theme.colors.textLight} />
                      <Text style={styles.amountText}>KSh {item.amount.toLocaleString()}</Text>
                    </View>
                  )}

                  {item.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={theme.colors.textLight} />
                      <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {item.status === 'pending_approval' && (
                <View style={styles.taskerActionContainer}>
                  <TouchableOpacity
                    style={[styles.taskerButton, styles.approveButton]}
                    onPress={() => handleUpdateRequest(item.id, 'in_progress')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.taskerButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.taskerButton, styles.rejectButton]}
                    onPress={() => handleRejectJob(item)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                    <Text style={styles.taskerButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>You have no pending booking requests.</Text>
          </View>
        )}
      />
    </>
  );

  const renderClientContent = () => (
    <>
      <Text style={styles.title}>My Booked Tasks</Text>
      <Text style={styles.subtitle}>Here you can view all the services you have booked, their status, and next actions.</Text>
      {jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={48} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>You haven't booked any tasks yet. Book a service to see it here!</Text>
        </View>
      ) : (
        <FlatList<Job>
          data={jobs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/home/screens/JobStatusScreen', params: { jobId: item.id } })}
            >
              <View style={styles.cardTop}>
                <View style={styles.infoContainer}>
                  <Text style={styles.taskerName}>{item.taskerInfo?.name || 'Tasker'}</Text>
                  <Text style={styles.dateText}>{new Date(item.date).toLocaleString()}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons name={STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] as any || 'help-circle-outline'} size={16} color={theme.colors.primary} />
                    <Text style={styles.statusText}>{STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status}</Text>
                  </View>
                  {item.amount && (
                    <Text style={styles.amountText}>Amount: KSh {item.amount.toLocaleString()}</Text>
                  )}
                </View>
                <View style={styles.actionContainer}>{renderActionButton(item)}</View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {renderViewSwitcher()}
        {activeView === 'tasker' ? renderTaskerContent() : renderClientContent()}
      </View>
    </SafeAreaView>
  );
};

const createStyles = createThemedStyles(theme => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 12,
    paddingBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 20,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: theme.colors.textLight,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.2 : 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
  },
  taskerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionContainer: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    opacity: 0.7,
  },
  actionButtonText: {
    marginLeft: 8,
    color: theme.colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextWhite: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  taskerActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  taskerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: theme.colors.success,
    marginBottom: 10,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  taskerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  switcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switcherButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  switcherButtonActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  switcherTextActive: {
    color: theme.colors.primary,
  },
  amountText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    marginTop: 4,
  },
  taskerCardContent: {
    flex: 1,
  },
  clientInfoSection: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientLocation: {
    fontSize: 13,
    color: theme.colors.textLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetails: {
    marginLeft: 60, // Align with client name
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
}));

export default NotificationsScreen;