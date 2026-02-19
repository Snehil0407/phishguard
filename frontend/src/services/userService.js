import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple encryption/decryption for storing credentials
const encryptPassword = (password) => {
  return btoa(password); // Base64 encoding (basic encryption)
};

const decryptPassword = (encrypted) => {
  return atob(encrypted); // Base64 decoding
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
    const credentialsRef = doc(db, 'emailCredentials', userId);
    const docSnap = await getDoc(credentialsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        emailAddress: data.emailAddress,
        password: decryptPassword(data.password),
        provider: data.provider
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting email credentials:', error);
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
