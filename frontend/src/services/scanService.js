import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, increment, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Save scan result to Firestore
export const saveScanResult = async (userId, scanData) => {
  try {
    console.log('Saving scan result:', scanData); // Debug log
    
    const scanResult = {
      userId,
      type: scanData.type, // 'email', 'sms', 'url'
      content: scanData.content || '',
      subject: scanData.subject || '',
      senderEmail: scanData.senderEmail || '',
      url: scanData.url || '',
      message: scanData.message || '',
      result: {
        isPhishing: scanData.result.is_phishing || false,
        confidence: scanData.result.confidence || 0,
        riskScore: scanData.result.risk_score || 0,
        severity: scanData.result.severity || 'unknown',
        redFlags: scanData.result.red_flags || [],
        greenFlags: scanData.result.green_flags || []
      },
      explanation: scanData.result.explanation || '',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    // Add scan to scans collection
    const docRef = await addDoc(collection(db, 'scans'), scanResult);
    console.log('Scan saved with ID:', docRef.id); // Debug log

    // Ensure user document exists, create if not
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        totalScans: 1,
        threatsDetected: scanData.result.is_phishing ? 1 : 0,
        safeContent: scanData.result.is_phishing ? 0 : 1,
        createdAt: serverTimestamp()
      });
    } else {
      // Update existing user statistics
      await updateDoc(userRef, {
        totalScans: increment(1),
        threatsDetected: increment(scanData.result.is_phishing ? 1 : 0),
        safeContent: increment(scanData.result.is_phishing ? 0 : 1)
      });
    }

    console.log('User stats updated'); // Debug log
    return docRef.id;
  } catch (error) {
    console.error('Error saving scan result:', error);
    throw error;
  }
};

// Get recent scans for a user
export const getRecentScans = async (userId, limitCount = 10) => {
  try {
    console.log('Fetching recent scans for user:', userId);
    
    // Try query with orderBy first
    try {
      const q = query(
        collection(db, 'scans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const scans = [];
      querySnapshot.forEach((doc) => {
        scans.push({ id: doc.id, ...doc.data() });
      });

      console.log('Scans fetched successfully:', scans.length);
      return scans;
    } catch (indexError) {
      // If index error, fall back to simple query and sort in memory
      console.warn('Firestore index not created, using fallback query:', indexError.message);
      
      const simpleQuery = query(
        collection(db, 'scans'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(simpleQuery);
      const scans = [];
      querySnapshot.forEach((doc) => {
        scans.push({ id: doc.id, ...doc.data() });
      });

      // Sort in memory by createdAt
      scans.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.timestamp);
        const bTime = b.createdAt?.toDate?.() || new Date(b.timestamp);
        return bTime - aTime;
      });

      console.log('Scans fetched with fallback, count:', scans.length);
      return scans.slice(0, limitCount);
    }
  } catch (error) {
    console.error('Error getting recent scans:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async (userId) => {
  try {
    const scansQuery = query(
      collection(db, 'scans'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(scansQuery);
    
    const stats = {
      totalScans: querySnapshot.size,
      threatsDetected: 0,
      safeContent: 0,
      todayScans: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.result.isPhishing) {
        stats.threatsDetected++;
      } else {
        stats.safeContent++;
      }

      const scanDate = new Date(data.timestamp);
      if (scanDate >= today) {
        stats.todayScans++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// Get scans by type
export const getScansByType = async (userId, type) => {
  try {
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const scans = [];
    querySnapshot.forEach((doc) => {
      scans.push({ id: doc.id, ...doc.data() });
    });

    return scans;
  } catch (error) {
    console.error('Error getting scans by type:', error);
    throw error;
  }
};
