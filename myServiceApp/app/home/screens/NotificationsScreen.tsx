// app/(tabs)/home/screens/NotificationsScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
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

// Utility to safely render values inside <Text>
function safeText(val: any) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  return JSON.stringify(val);
}

// Add a utility to get the status badge (reuse from BookedTasksList)
function getStatusBadge(status: string, theme: any) {
  let color = theme.colors.primary;
  let bg = theme.colors.primaryLight;
  let icon = 'hourglass-outline';
  if (status === 'paid') {
    color = theme.colors.success;
    bg = theme.dark ? theme.colors.success : 'rgba(46, 184, 92, 0.15)';
    icon = 'checkmark-circle-outline';
  } else if (status === 'failed' || status === 'payment_failed' || status === 'rejected') {
    color = theme.colors.error;
    bg = theme.dark ? theme.colors.error : 'rgba(220, 53, 69, 0.15)';
    icon = 'close-circle-outline';
  } else if (status === 'processing_payment') {
    color = theme.colors.primary;
    bg = theme.colors.primaryLight;
    icon = 'sync-outline';
  } else if (status === 'in_progress') {
    color = theme.colors.primary;
    bg = theme.colors.primaryLight;
    icon = 'play-circle-outline';
  } else if (status === 'in_escrow') {
    color = theme.colors.primary;
    bg = theme.colors.primaryLight;
    icon = 'lock-closed-outline';
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: 'bold', color }}>{safeText(status.replace(/_/g, ' ').toUpperCase())}</Text>
    </View>
  );
}

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [isTasker, setIsTasker] = useState(false);
  const [activeView, setActiveView] = useState<'client' | 'tasker'>('client');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [jobToReject, setJobToReject] = useState<Job | null>(null);

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
    setActionLoading(jobId + '-' + newStatus);
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status: newStatus });
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      Alert.alert('Success', `Booking has been ${newStatus === 'in_progress' ? 'approved' : 'rejected'}.`);
    } catch (error) {
      console.error(`Error updating booking status:`, error);
      Alert.alert('Error', 'Failed to update the booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectJob = (job: Job) => {
    setJobToReject(job);
    setRejectModalVisible(true);
  };

  const rejectJobWithReason = async (jobId: string, reason: string, reasonText: string) => {
    setActionLoading(jobId + '-rejected');
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
    } finally {
      setActionLoading(null);
      setRejectModalVisible(false);
      setJobToReject(null);
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
                viewMode: 'tasker'
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
                    <Text style={styles.clientName}>{safeText(item.clientInfo?.name || 'A Client')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.textLight} />
                      <Text style={styles.clientLocation}>
                        {safeText(item.address || 'Location not specified')}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.jobDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textLight} />
                    <Text style={styles.detailText}>
                      {safeText(new Date(item.date).toLocaleDateString())} at {safeText(new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                    </Text>
                  </View>
                  {item.amount && (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag-outline" size={16} color={theme.colors.textLight} />
                      <Text style={styles.amountText}>KSh {safeText(item.amount.toLocaleString())}</Text>
                    </View>
                  )}
                  {item.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={theme.colors.textLight} />
                      <Text style={styles.notesText} numberOfLines={2}>{safeText(item.notes)}</Text>
                    </View>
                  )}
                </View>
              </View>
              {/* Action Area */}
              {item.status === 'pending_approval' && (
                <View style={styles.actionArea}>
                  <TouchableOpacity
                    style={[styles.actionButtonBig, styles.approveButtonBig, actionLoading === item.id + '-in_progress' && styles.actionButtonDisabled]}
                    onPress={() => handleUpdateRequest(item.id, 'in_progress')}
                    disabled={actionLoading === item.id + '-in_progress'}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonBigText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButtonBig, styles.rejectButtonBig, actionLoading === item.id + '-rejected' && styles.actionButtonDisabled]}
                    onPress={() => handleRejectJob(item)}
                    disabled={actionLoading === item.id + '-rejected'}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonBigText}>Reject</Text>
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
      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Reject Booking</Text>
            <Text style={styles.rejectModalSubtitle}>Please select a reason for rejecting this booking:</Text>
            <TouchableOpacity style={styles.rejectReasonBtn} onPress={() => jobToReject && rejectJobWithReason(jobToReject.id, 'unavailable', 'I am not available at this time')}>
              <Text style={styles.rejectReasonText}>Unavailable</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectReasonBtn} onPress={() => jobToReject && rejectJobWithReason(jobToReject.id, 'location', 'The location is too far from my service area')}>
              <Text style={styles.rejectReasonText}>Location Too Far</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectReasonBtn} onPress={() => jobToReject && rejectJobWithReason(jobToReject.id, 'details', 'I need more details about the job requirements')}>
              <Text style={styles.rejectReasonText}>Insufficient Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectReasonBtn} onPress={() => jobToReject && rejectJobWithReason(jobToReject.id, 'other', 'Other reason')}>
              <Text style={styles.rejectReasonText}>Other</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectModalCancelBtn} onPress={() => setRejectModalVisible(false)}>
              <Text style={styles.rejectModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
                  <Text style={styles.taskerName}>{safeText(item.taskerInfo?.name || 'Tasker')}</Text>
                  <Text style={styles.dateText}>{safeText(new Date(item.date).toLocaleString())}</Text>
                  <View style={styles.statusRow}>
                    {getStatusBadge(item.status, theme)}
                  </View>
                  {item.amount && (
                    <Text style={styles.amountText}>Amount: KSh {safeText(item.amount.toLocaleString())}</Text>
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
  actionArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  actionButtonBig: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  approveButtonBig: {
    backgroundColor: theme.colors.success,
  },
  rejectButtonBig: {
    backgroundColor: theme.colors.error,
  },
  actionButtonBigText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectModalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 28,
    width: '85%',
    alignItems: 'center',
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 10,
  },
  rejectModalSubtitle: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 18,
    textAlign: 'center',
  },
  rejectReasonBtn: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  rejectReasonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  rejectModalCancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectModalCancelText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}));

export default NotificationsScreen;