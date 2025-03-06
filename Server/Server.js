const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { getStorage } = require("firebase-admin/storage");
dotenv.config(); // Load environment variables
const multer = require("multer");
const serviceAccount = require("../serviceAccountKey.json");
const fs = require("fs");
const axios = require("axios");
const AdmZip = require("adm-zip");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  const db = admin.firestore(); // ✅ Ensure db is defined


const app = express();  
app.use(cors());
app.use(express.json());

const GITHUB_USERNAME = "Basel-Sherif";
const GITHUB_REPO = "image-uploads";
const GITHUB_TOKEN = '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';

const upload = multer({ dest: "uploads/" });
// ✅ Corrected path for Firebase service account key

app.get("/about", async (req, res) => {
    try {
        const aboutRef = db.collection("about").doc("unique-about-id"); // Ensure "main" exists in FireStore
        const aboutSnapshot = await aboutRef.get();
        
        if (!aboutSnapshot.exists) {
            console.log("❌ No about data found in FireStore.");
        return res.status(404).json({ error: "No about data found." });
        }
    
        res.json(aboutSnapshot.data());
    } catch (error) {
        console.error("🔥 FireStore Error:", error);
        res.status(500).json({ error: "Failed to retrieve about data." });
    }
});  

// ✅ POST API to update the "About" section
app.post("/about", async (req, res) => {
    try {
        const aboutData = req.body;

        // 🛑 Validate request body
        if (!aboutData || !aboutData.title || !aboutData.description) {
            return res.status(400).json({ error: "Missing required fields: title, description" });
        }

        // ✅ Update FireStore document
        const aboutRef = db.collection("about").doc("unique-about-id"); // Ensure "main" is the correct document ID
        await aboutRef.set(aboutData, { merge: true }); // Merge keeps existing data intact

        console.log("✅ About section updated successfully!");
        res.status(200).json({ message: "About section updated successfully!" });
    } catch (error) {
        console.error("🔥 Error updating about section:", error);
        res.status(500).json({ error: "Failed to update about section." });
    }
});


// Route to get password section data from FireStore
app.get("/password", async (req, res) => {
    try {
      const passwordRef = db.collection("password").doc("password-id"); // Ensure "main" exists in FireStore
      const passwordSnapshot = await passwordRef.get();
  
      if (!passwordSnapshot.exists) {
        console.log("❌ No password data found in FireStore.");
        return res.status(404).json({ error: "No password data found." });
      }
  
      res.json(passwordSnapshot.data());
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to retrieve password data." });
    }
  });
  
  // Route to update password section in FireStore
  app.post("/password", async (req, res) => {
    try {
      const newData = req.body;
      const passwordRef = db.collection("password").doc("password-id"); 
  
      await passwordRef.set(newData, { merge: true }); // ✅ This updates the data without overwriting everything
  
      console.log("✅ Password section updated successfully:", newData);
      res.status(200).json({ message: "Password section updated successfully", newData });
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to update password data." });
    }
  });


  app.post("/verify-password", async (req, res) => {
    try {
        const { password } = req.body; // Get user input
        const passwordRef = db.collection("password").doc("password-id");
        const passwordSnapshot = await passwordRef.get();

        if (!passwordSnapshot.exists) {
            return res.status(404).json({ error: "No password data found." });
        }

        const storedHashedPassword = passwordSnapshot.data().password;
        console.log("🔍 Entered Password:", password);

        const isMatch = await bcrypt.compare(password, storedHashedPassword);

        if (password === storedHashedPassword) {
            res.status(200).json({ message: "Password is correct", status : true });
        } else {
            res.status(401).json({ error: "Incorrect password", status : false });
        }
    } catch (error) {
        console.error("🔥 Firestore Error:", error);
        res.status(500).json({ error: "Failed to verify password." });
    }
});



// Route to get services section data from FireStore
app.get("/services", async (req, res) => {
    try {
      const servicesRef = db.collection("services").doc("services-id"); // Ensure "main" exists in FireStore
      const servicesSnapshot = await servicesRef.get();
  
      if (!servicesSnapshot.exists) {
        console.log("❌ No services data found in FireStore.");
        return res.status(404).json({ error: "No services data found." });
      }
  
      res.json(servicesSnapshot.data());
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to retrieve services data." });
    }
  });
  
  // Route to update services section in FireStore
  app.post("/services", async (req, res) => {
    try {
      const newData = req.body;
      const servicesRef = db.collection("services").doc("services-id");
  
      await servicesRef.set(newData, { merge: true }); // ✅ Updates the data without overwriting everything
  
      console.log("✅ Services section updated successfully:", newData);
      res.status(200).json({ message: "Services section updated successfully", newData });
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to update services data." });
    }
  });
  

// Route to get all invite entries from FireStore
app.get("/invite", async (req, res) => {
    try {
      const inviteRef = db.collection("invite");
      const snapshot = await inviteRef.get();
  
      if (snapshot.empty) {
        console.log("❌ No invite entries found in FireStore.");
        return res.status(404).json({ error: "No invite entries found." });
      }
  
      const inviteContent = [];
      snapshot.forEach((doc) => {
        inviteContent.push({ id: doc.id, ...doc.data() });
      });
  
      res.json(inviteContent);
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to retrieve invite entries." });
    }
  });
  
  // Route to add a new profile to FireStore
  app.post("/invite", async (req, res) => {
    try {
      const newProfile = req.body;
      const inviteRef = db.collection("invite").doc("invite-id");
  
      const docRef = await inviteRef.add(newProfile); // FireStore auto-generates an ID
      const addedProfile = { id: docRef.id, ...newProfile };
  
      console.log("✅ Profile added successfully:", addedProfile);
      res.status(200).json({ message: "Profile added successfully", profile: addedProfile });
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to add profile." });
    }
  });
  
  // Route to delete a profile from FireStore
  app.delete("/invite/:id", async (req, res) => {
    try {
      const profileId = req.params.id;
      const profileRef = db.collection("invite").doc(profileId);
  
      const profileSnapshot = await profileRef.get();
      if (!profileSnapshot.exists) {
        console.log("❌ Profile not found in FireStore.");
        return res.status(404).json({ error: "Profile not found." });
      }
  
      await profileRef.delete();
      console.log(`✅ Profile with ID ${profileId} deleted successfully.`);
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to delete profile." });
    }
  });
  
  const contactDocRef = db.collection("contact-form").doc("contact-form-id");

  // Route to get the contact form data from FireStore
  app.get("/contact-form", async (req, res) => {
    try {
      const doc = await contactDocRef.get();
  
      if (!doc.exists) {
        console.log("❌ No contact form data found.");
        return res.status(404).json({ error: "No contact form data found." });
      }
  
      res.json(doc.data());
    } catch (error) {
      console.error("🔥 FireStore Error:", error);
      res.status(500).json({ error: "Failed to retrieve contact form data." });
    }
  });
  
  app.post("/contact-form", async (req, res) => {
    try {
  
      // 🔹 1. Delete all existing documents in the collection
      const snapshot = await contactDocRef.get();
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
  
      // 🔹 2. Insert new form data
      await contactDocRef.doc("contact-form-id").set({ fields: req.body.fields });
  
      res.json({ message: "Form data updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error saving form data" });
    }
  });
  
  const uploadsRef = db.collection("uploads").doc("uploads-imges");

  app.post(
    "/upload",
    upload.fields([
      { name: "slider", maxCount: 10 },
      { name: "GalleryPhoto", maxCount: 10 },
      { name: "StoredPhotos", maxCount: 10 },
      { name: "Logos", maxCount: 10 }, // Logos field
    ]),
    async (req, res) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }
  
        // Fetch existing data from Firestore
        const existingDataSnap = await uploadsRef.get();
        const existingData = existingDataSnap.exists ? existingDataSnap.data() : {};
  
        // Initialize storage structure while keeping existing data
        const uploadedImages = {
          slider: existingData.slider || [],
          GalleryPhoto: existingData.GalleryPhoto || [],
          StoredPhotos: existingData.StoredPhotos || [],
          Logos: existingData.Logos || [], 
        };
  
        for (const category in req.files) {
          for (const file of req.files[category]) {
            const filePath = file.path;
            const fileContent = fs.readFileSync(filePath, { encoding: "base64" });
            const filename = `uploads/${Date.now()}-${file.originalname}`;
  
            // GitHub API URL
            const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${filename}`;
  
            // Upload to GitHub
            const response = await axios.put(
              githubApiUrl,
              {
                message: `Uploaded ${file.originalname}`,
                content: fileContent,
              },
              {
                headers: {
                  Authorization: `token ${GITHUB_TOKEN}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );
  
            const imageUrl = response.data.content.download_url;
  
            // 🛑 Prevent Duplicates: Check if the file already exists
            const isDuplicate = uploadedImages[category].some((img) => img.filename === file.originalname);
  
            if (!isDuplicate) {
              uploadedImages[category].push({
                url: imageUrl,
                isActive: false,
                filename: file.originalname,
                uploadedAt: new Date(),
              });
            }
          }
        }
  
        // Store updated data in Firestore (preserving old data without duplicates)
        await uploadsRef.set(uploadedImages, { merge: true });
  
        res.json({ success: true, uploadedImages });
      } catch (error) {
        console.error("Upload failed:", error.response?.data || error.message);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  app.patch("/toggle-photo-status", async (req, res) => {
    try {
      const { category, url } = req.body;
  
      if (!category || !url) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Fetch existing data
      const existingDataSnap = await uploadsRef.get();
      const existingData = existingDataSnap.exists ? existingDataSnap.data() : {};
  
      if (!existingData[category]) {
        return res.status(404).json({ error: "Category not found" });
      }
  
      // Check if only one active image is allowed
      const isSingleActiveCategory = category === "GalleryPhoto" || category === "Logos";
  
      existingData[category] = existingData[category].map((image) =>
        isSingleActiveCategory
          ? { ...image, isActive: image.url === url } // Ensure only one active
          : image.url === url
          ? { ...image, isActive: !image.isActive } // Toggle for multiple active
          : image
      );
  
      // Save the updated data
      await uploadsRef.set(existingData, { merge: true });
  
      // Return the updated data
      res.json({ success: true, updatedImages: existingData[category] });
    } catch (error) {
      console.error("Error updating photo status:", error);
      res.status(500).json({ error: "Failed to update photo status" });
    }
  });  
  
    // Delete a specific photo by URL
app.delete("/delete-photo", async (req, res) => {
  try {
    const { category, url } = req.body;

    if (!category || !url) {
      return res.status(400).json({ error: "Category and URL are required" });
    }

    // Get existing data
    const existingData = (await uploadsRef.get()).data() || {};
    
    if (!existingData[category]) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Filter out the photo to delete
    existingData[category] = existingData[category].filter((photo) => photo.url !== url);

    // Update Firestore
    await uploadsRef.set(existingData, { merge: true });

    res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Delete all photos in a specific category
app.delete("/delete-category", async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Get existing data
    const existingData = (await uploadsRef.get()).data() || {};

    if (!existingData[category]) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Clear the category
    existingData[category] = [];

    // Update Firestore
    await uploadsRef.set(existingData, { merge: true });

    res.json({ success: true, message: `All photos in ${category} deleted successfully` });
  } catch (error) {
    console.error("Delete failed:", error.message);
    res.status(500).json({ error: "Delete failed" });
  }
});
  
  
  // 📌 Get All Uploaded Images
  app.get("/images", async (req, res) => {
    try {
      const snapshot = await db.collection("uploads").get();
      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

// Define the server port
const port = process.env.PORT || 5000;

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
