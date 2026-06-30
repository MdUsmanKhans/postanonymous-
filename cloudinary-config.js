// cloudinary-config.js
//
// Cloudinary's free tier is used for image hosting instead of Firebase
// Storage (which now requires Firebase's paid Blaze plan). Cloudinary's
// free tier needs no credit card.
//
// SETUP (2 minutes):
// 1. Sign up at https://cloudinary.com (free).
// 2. On your Cloudinary dashboard, copy your "Cloud name" and paste it below.
// 3. Go to Settings (gear icon) → Upload → Upload presets → Add upload preset.
//    - Set "Signing mode" to "Unsigned".
//    - (Optional) Set folder to "posts" to keep things tidy.
//    - Save, then copy the preset name and paste it below.

export const CLOUDINARY_CLOUD_NAME = "your-cloud-name";  // <-- REPLACE with your Cloudinary cloud name
export const CLOUDINARY_UPLOAD_PRESET = "your-upload-preset";  // <-- REPLACE with your Cloudinary upload preset name

// Uploads a File object to Cloudinary and resolves with the public image URL.
export async function uploadImageToCloudinary(file){
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!response.ok){
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = await response.json();
  return data.secure_url;
}
