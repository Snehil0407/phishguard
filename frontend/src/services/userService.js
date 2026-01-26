import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
