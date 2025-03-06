let firebaseApp;
let firestoredb;

const initializeFireBase = async () => {
  try {
    const { initializeApp } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");

    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    };

    firebaseApp = initializeApp(firebaseConfig);
    firestoredb = getFirestore(firebaseApp);
    console.log("🔥 Firebase Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
  }
};

const uploadProcessesData = async () => {
  try {
    const { doc, setDoc } = await import("firebase/firestore");

    const dataToUpload = {
      about: "NewAbout From Firebase File",
      id: 1,
      date: new Date().toISOString(), // Ensure Firestore-friendly format
    };

    if (!firestoredb) {
      console.error("❌ Firestore is not initialized");
      return;
    }

    const document = doc(firestoredb, "about", "unique-about-id");

    // Validate the data before uploading
    if (!dataToUpload.about || typeof dataToUpload.about !== "string") {
      throw new Error("Invalid 'about' field: Must be a non-empty string.");
    }

    await setDoc(document, dataToUpload);
    console.log("✅ Data uploaded successfully");
  } catch (error) {
    console.error("❌ Error uploading data:", error.message);
  }
};






// Export the functions
module.exports = { initializeFireBase, uploadProcessesData };
