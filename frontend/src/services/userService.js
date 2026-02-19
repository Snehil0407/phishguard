import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple encryption/decryption for storing credentials
const encryptPassword = (password) => {
  try {
    const encrypted = btoa(password); // Base64 encoding (basic encryption)
    console.log('[ENCRYPT] Password length:', password.length, 'Encrypted length:', encrypted.length);
    return encrypted;
  } catch (error) {
    console.error('[ENCRYPT] Error encrypting password:', error);
    return password; // Return as-is if encryption fails
  }
};

const decryptPassword = (encrypted) => {
  try {
    const decrypted = atob(encrypted); // Base64 decoding
    console.log('[DECRYPT] Encrypted length:', encrypted.length, 'Decrypted length:', decrypted.length);
    return decrypted;
  } catch (error) {
    console.error('[DECRYPT] Error decrypting password:', error);
    return encrypted; // Return as-is if decryption fails
  }
};

// Save email credentials
export const saveEmailCredentials = async (userId, emailAddress, password, provider) => {
  try {
    const credentialsRef = doc(db, 'emailCredentials', userId);
    await setDoc(credentialsRef, {
      emailAddress,
      password: encryptPassword(password),
      provider,
      updatedAt: new Date().toISOString()
    });
    console.log('Email credentials saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving email credentials:', error);
    throw error;
  }
};

// Get saved email credentials
export const getEmailCredentials = async (userId) => {
  try {
    console.log('[FIRESTORE] Getting credentials for userId:', userId);
    const credentialsRef = doc(db, 'emailCredentials', userId);
    const docSnap = await getDoc(credentialsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('[FIRESTORE] Document exists. Has emailAddress:', !!data.emailAddress, 'Has password:', !!data.password);
      
      // Check if credentials are actually populated (not empty strings)
      if (data.emailAddress && data.password) {
        const decryptedPassword = decryptPassword(data.password);
        console.log('[FIRESTORE] ✅ Returning credentials:', {
          email: data.emailAddress,
          passwordLength: decryptedPassword.length,
          provider: data.provider || 'gmail'
        });
        return {
          emailAddress: data.emailAddress,
          password: decryptedPassword,
          provider: data.provider || 'gmail'
        };
      } else {
        console.log('[FIRESTORE] ⚠️ Document exists but credentials are empty');
      }
    } else {
      console.log('[FIRESTORE] ℹ️ No document found');
    }
    return null;
  } catch (error) {
    console.error('[FIRESTORE] ❌ Error getting email credentials:', error);
    return null;
  }
};

// Delete saved credentials
export const deleteEmailCredentials = async (userId) => {
  try {
    const credentialsRef = doc(db, 'emailCredentials', userId);
    await setDoc(credentialsRef, {
      emailAddress: '',
      password: '',
      provider: 'gmail',
      updatedAt: new Date().toISOString()
    });
    console.log('Email credentials deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting email credentials:', error);
    throw error;
  }
};

// Update user profile information
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log('Updating user profile:', userId, profileData);
    
    const userRef = doc(db, 'users', userId);
    const updateData = {};
    
    if (profileData.displayName !== undefined) {
      updateData.displayName = profileData.displayName;
    }
    
    if (profileData.phoneNumber !== undefined) {
      updateData.phoneNumber = profileData.phoneNumber;
    }
    
    if (profileData.photoURL !== undefined) {
      updateData.photoURL = profileData.photoURL;
    }
    
    await updateDoc(userRef, updateData);
    console.log('Profile updated successfully');
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
