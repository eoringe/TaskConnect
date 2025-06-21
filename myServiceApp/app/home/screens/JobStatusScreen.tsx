import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase-config';

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
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            setLoading(true);
            try {
                const jobSnap = await getDoc(doc(db, 'jobs', jobId as string));
                if (jobSnap.exists()) {
                    setJob({ id: jobSnap.id, ...jobSnap.data() });
                } else {
                    setError('Job not found');
                }
            } catch (e) {
                setError('Failed to fetch job');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
        // Optionally poll for job status changes
        const interval = setInterval(fetchJob, 5000);
        return () => clearInterval(interval);
    }, [jobId]);

    const handleApprovePayment = async () => {
        setApproving(true);
        try {
            const res = await fetch('https://<your-backend>/mpesa/b2c', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    taskerPhone: job.taskerPhone, // You may need to fetch this from the tasker profile
                    amount: job.amount
                })
            });
            const data = await res.json();
            if (data.disbursementId) {
                Alert.alert('Success', 'Payment approved and sent to tasker.');
            } else {
                Alert.alert('Error', 'Failed to approve payment.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to approve payment.');
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
    }
    if (error) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;
    }

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Job Status</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Status: {job.status}</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Amount: Ksh {job.amount}</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Date: {job.date}</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Address: {job.address}</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Notes: {job.notes}</Text>
            {job.status === 'in_escrow' && (
                <Button
                    title={approving ? 'Approving...' : 'Approve Payment'}
                    onPress={handleApprovePayment}
                    disabled={approving}
                />
            )}
            {job.status === 'paid' && (
                <Text style={{ color: 'green', marginTop: 16 }}>Payment Complete!</Text>
            )}
            {job.status === 'failed' && (
                <Text style={{ color: 'red', marginTop: 16 }}>Payment Failed</Text>
            )}
        </View>
    );
};

export default JobStatusScreen; 