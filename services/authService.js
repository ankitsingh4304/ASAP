// services/authService.js
import { auth, db, storage } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const registerUser = async (name, email, password, role, reportFile) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  });

  // Optional initial report upload for patient
  if (role === "patient" && reportFile) {
    const safeName = reportFile.name || `report_${Date.now()}.pdf`;
    const response = await fetch(reportFile.uri);
    const blob = await response.blob();

    const fileRef = ref(storage, `reports/${uid}/${safeName}`);
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);

    await setDoc(doc(db, "users", uid, "reports", safeName), {
      fileUrl: downloadURL,
      fileName: safeName,
      uploadedAt: serverTimestamp(),
    });
  }

  return uid;
};

export const loginUser = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.data()?.role || null;
};

export const logoutUser = () => signOut(auth);
