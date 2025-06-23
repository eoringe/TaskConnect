import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase-config';
import { useTheme } from '@/app/context/ThemeContext';
import { createThemedStyles, useThemedStyles } from '@/app/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';

/**
 * JobStatusScreen is a React component that displays the status and details of a specific job.
 * 
 * It fetches job data from Firestore using the provided `jobId` from local search parameters,
 * and polls for updates every 5 seconds. The screen shows job information such as status, amount,
 * date, address, and notes. If the job is in escrow, it allows the user to approve payment to the
 * tasker by triggering a backend API call. The UI provides feedback for loading, errors, and payment
 * approval status.
 * 
 * @component
 * @returns {JSX.Element} The rendered job status screen.
 */
const JobStatusScreen = () => {
    const { jobId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        const fetchJob = async (initialLoad = false) => {
            if (initialLoad) setLoading(true);
            try {
                const jobSnap = await getDoc(doc(db, 'jobs', jobId as string));
                if (jobSnap.exists()) {
                    setJob({ id: jobSnap.id, ...jobSnap.data() });
                    setError(null);
                } else {
                    setError('Job not found');
                }
            } catch (e) {
                console.error("Failed to fetch job:", e);
                setError('Failed to fetch job');
            } finally {
                if (initialLoad) setLoading(false);
            }
        };

        fetchJob(true); // First fetch with loading indicator

        const interval = setInterval(() => fetchJob(), 5000); // Subsequent polls without loading indicator

        return () => clearInterval(interval);
    }, [jobId]);

    const handleApprovePayment = async () => {
        setApproving(true);
        try {
            if (!job?.taskerId) {
                Alert.alert('Error', 'Tasker ID is missing from the job.');
                setApproving(false);
                return;
            }

            const taskerDocRef = doc(db, 'taskers', job.taskerId);
            const taskerDocSnap = await getDoc(taskerDocRef);

            if (!taskerDocSnap.exists()) {
                Alert.alert('Error', 'Tasker details not found.');
                setApproving(false);
                return;
            }

            const taskerData = taskerDocSnap.data();
            const taskerPhone = taskerData?.phoneNumber;

            if (!taskerPhone) {
                Alert.alert('Error', 'Tasker phone number not found.');
                setApproving(false);
                return;
            }

            // NOTE: Remember to replace this with your actual backend URL
            const res = await fetch('https://7cd5-41-80-114-234.ngrok-free.app/taskconnect-30e07/us-central1/api/mpesa/b2c', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    taskerPhone: taskerPhone,
                    amount: job.amount
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'An unknown server error occurred' }));
                throw new Error(errorData.message || 'Failed to approve payment.');
            }

            const data = await res.json();

            if (data.success) {
                Alert.alert('Success', 'Payment approved and is being processed.');
                // Optimistically update local state while waiting for backend webhook to update Firestore
                setJob({ ...job, status: 'processing_payment' });
            } else {
                Alert.alert('Error', data.message || 'Failed to approve payment.');
            }
        } catch (e: any) {
            console.error('Payment approval error:', e);
            Alert.alert('Error', e.message || 'An error occurred while approving payment.');
        } finally {
            setApproving(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'in_escrow':
                return {
                    container: styles.statusBadgeWarning,
                    text: styles.statusText,
                    icon: 'hourglass-outline' as const
                };
            case 'paid':
                return {
                    container: styles.statusBadgeSuccess,
                    text: styles.statusText,
                    icon: 'checkmark-circle-outline' as const
                };
            case 'failed':
                return {
                    container: styles.statusBadgeError,
                    text: styles.statusText,
                    icon: 'close-circle-outline' as const
                };
            case 'processing_payment':
                return {
                    container: styles.statusBadgeInfo,
                    text: styles.statusText,
                    icon: 'sync-outline' as const
                };
            default:
                return {
                    container: styles.statusBadgeDefault,
                    text: styles.statusText,
                    icon: 'help-circle-outline' as const
                };
        }
    };

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }
    if (error) {
        return <View style={styles.loadingContainer}><Text style={styles.errorText}>{error}</Text></View>;
    }

    const jobStatus = job?.status || 'unknown';
    const statusStyle = getStatusStyle(jobStatus);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <Text style={styles.title}>Job Status</Text>
            </View>

            {job ? (
                <View style={styles.card}>
                    <View style={[styles.statusBadge, statusStyle.container]}>
                        <Ionicons name={statusStyle.icon} size={22} color={theme.colors.text} />
                        <Text style={[styles.statusText, statusStyle.text]}>{jobStatus.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="pricetag-outline" size={20} color={theme.colors.textLight} style={styles.icon} />
                        <Text style={styles.detailText}>Ksh {job.amount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.textLight} style={styles.icon} />
                        <Text style={styles.detailText}>{new Date(job.date).toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color={theme.colors.textLight} style={styles.icon} />
                        <Text style={styles.detailText}>{job.address}</Text>
                    </View>
                    {job.notes && (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color={theme.colors.textLight} style={styles.icon} />
                            <Text style={styles.detailText}>{job.notes}</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.card}>
                    <Text>No job details found.</Text>
                </View>
            )}

            {jobStatus === 'in_escrow' && (
                <TouchableOpacity
                    style={[styles.button, approving && styles.buttonDisabled]}
                    onPress={handleApprovePayment}
                    disabled={approving}
                >
                    {approving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Approve Payment to Tasker</Text>
                    )}
                </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.replace('/home')}>
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back to Home</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const createStyles = createThemedStyles(theme => ({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.dark ? 0.25 : 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    statusBadgeSuccess: { backgroundColor: theme.dark ? theme.colors.success : 'rgba(46, 184, 92, 0.15)' },
    statusBadgeWarning: { backgroundColor: theme.dark ? theme.colors.warning : 'rgba(255, 193, 7, 0.15)' },
    statusBadgeError: { backgroundColor: theme.dark ? theme.colors.error : 'rgba(220, 53, 69, 0.15)' },
    statusBadgeInfo: { backgroundColor: theme.colors.primaryLight },
    statusBadgeDefault: { backgroundColor: theme.colors.border },
    statusText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    icon: {
        marginRight: 15,
        marginTop: 2,
    },
    detailText: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        lineHeight: 22,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.primaryLight,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    secondaryButtonText: {
        color: theme.colors.primary,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 16,
        textAlign: 'center',
    },
}));

export default JobStatusScreen; 