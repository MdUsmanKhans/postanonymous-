// app.js
import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { uploadImageToCloudinary } from "./cloudinary-config.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// ---------- elements ----------
const board = document.getElementById("board");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");

const fab = document.getElementById("openComposer");
const overlay = document.getElementById("composerOverlay");
const closeBtn = document.getElementById("closeComposer");

const postText = document.getElementById("postText");
const charCount = document.getElementById("charCount");

const imageDrop = document.getElementById("imageDrop");
const imageDropEmpty = document.getElementById("imageDropEmpty");
const imageInput = document.getElementById("imageInput");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImage");

const submitBtn = document.getElementById("submitPost");
const submitLabel = document.getElementById("submitLabel");
const composerError = document.getElementById("composerError");
const toast = document.getElementById("toast");

const authStatus = document.getElementById("authStatus");
const authActions = document.getElementById("authActions");
const authOverlay = document.getElementById("authOverlay");
const closeAuthBtn = document.getElementById("closeAuth");
const authModalTitle = document.getElementById("authModalTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authToggleMode = document.getElementById("authToggleMode");
const authSubmit = document.getElementById("authSubmit");
const authSubmitLabel = document.getElementById("authSubmitLabel");
const authError = document.getElementById("authError");

let currentUser = null;
let authMode = "login"; // or "signup"

let selectedFile = null;
const MAX_CHARS = 2000;
const MAX_IMAGE_MB = 5;

// ---------- composer open/close ----------
function openComposer(){
  overlay.classList.add("open");
  postText.focus();
}
function closeComposer(){
  overlay.classList.remove("open");
  resetComposer();
}
function resetComposer(){
  postText.value = "";
  charCount.textContent = `0 / ${MAX_CHARS}`;
  clearImage();
  showError("");
  submitBtn.disabled = false;
  submitLabel.textContent = "Pin it";
}

fab.addEventListener("click", () => {
  if (currentUser){
    openComposer();
  } else {
    openAuth("login");
  }
});
closeBtn.addEventListener("click", closeComposer);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeComposer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("open")) closeComposer();
});

postText.addEventListener("input", () => {
  charCount.textContent = `${postText.value.length} / ${MAX_CHARS}`;
});

// ---------- image select ----------
imageDropEmpty.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  handleFile(file);
});

// drag & drop support
["dragover", "drop"].forEach((evt) => {
  imageDrop.addEventListener(evt, (e) => e.preventDefault());
});
imageDrop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file){
  if (!file.type.startsWith("image/")){
    showError("That file isn't an image.");
    return;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024){
    showError(`Image must be under ${MAX_IMAGE_MB}MB.`);
    return;
  }
  showError("");
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    imagePreview.src = ev.target.result;
    imageDropEmpty.hidden = true;
    imagePreviewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
}

function clearImage(){
  selectedFile = null;
  imageInput.value = "";
  imagePreview.src = "";
  imageDropEmpty.hidden = false;
  imagePreviewWrap.hidden = true;
}
removeImageBtn.addEventListener("click", clearImage);

function showError(msg){
  if (!msg){
    composerError.hidden = true;
    composerError.textContent = "";
  } else {
    composerError.hidden = false;
    composerError.textContent = msg;
  }
}

// ---------- submit ----------
submitBtn.addEventListener("click", async () => {
  if (!currentUser){
    showError("You've been logged out. Log in to pin a post.");
    closeComposer();
    openAuth("login");
    return;
  }

  const text = postText.value.trim();

  if (!text && !selectedFile){
    showError("Write something or attach an image before pinning.");
    return;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = "Pinning…";
  showError("");

  try {
    let imageUrl = null;

    if (selectedFile){
      imageUrl = await uploadImageToCloudinary(selectedFile);
    }

    await addDoc(collection(db, "posts"), {
      text: text || null,
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    });

    closeComposer();
    showToast("Pinned to the board.");
  } catch (err){
    console.error(err);
    showError("Couldn't pin that. Try again.");
    submitBtn.disabled = false;
    submitLabel.textContent = "Pin it";
  }
});

// ---------- toast ----------
let toastTimer = null;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ---------- auth modal open/close ----------
function openAuth(mode){
  authMode = mode;
  applyAuthMode();
  authOverlay.classList.add("open");
  authEmail.focus();
}
function closeAuth(){
  authOverlay.classList.remove("open");
  authEmail.value = "";
  authPassword.value = "";
  showAuthError("");
  authSubmit.disabled = false;
}
function applyAuthMode(){
  if (authMode === "login"){
    authModalTitle.textContent = "log in to post";
    authSubmitLabel.textContent = "Log in";
    authToggleMode.textContent = "need an account? sign up";
  } else {
    authModalTitle.textContent = "create an account to post";
    authSubmitLabel.textContent = "Sign up";
    authToggleMode.textContent = "already have an account? log in";
  }
}
authToggleMode.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  applyAuthMode();
  showAuthError("");
});
closeAuthBtn.addEventListener("click", closeAuth);
authOverlay.addEventListener("click", (e) => {
  if (e.target === authOverlay) closeAuth();
});

function showAuthError(msg){
  if (!msg){
    authError.hidden = true;
    authError.textContent = "";
  } else {
    authError.hidden = false;
    authError.textContent = msg;
  }
}

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password){
    showAuthError("Enter both email and password.");
    return;
  }
  if (password.length < 6){
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  authSubmit.disabled = true;
  showAuthError("");

  try {
    if (authMode === "login"){
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    closeAuth();
    openComposer();
  } catch (err){
    console.error(err);
    showAuthError(friendlyAuthError(err.code));
    authSubmit.disabled = false;
  }
});

function friendlyAuthError(code){
  switch(code){
    case "auth/email-already-in-use": return "That email already has an account — try logging in.";
    case "auth/invalid-email": return "That email doesn't look right.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Email or password is incorrect.";
    case "auth/too-many-requests": return "Too many attempts. Try again in a bit.";
    default: return "Something went wrong. Try again.";
  }
}

// ---------- auth state ----------
function renderAuthBar(){
  authActions.innerHTML = "";

  if (currentUser){
    authStatus.textContent = "signed in";
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "auth-link-btn";
    logoutBtn.textContent = "Log out";
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      showToast("Logged out.");
    });
    authActions.appendChild(logoutBtn);
  } else {
    authStatus.textContent = "browsing anonymously";
    const loginBtn = document.createElement("button");
    loginBtn.className = "auth-link-btn";
    loginBtn.textContent = "Log in";
    loginBtn.addEventListener("click", () => openAuth("login"));

    const signupBtn = document.createElement("button");
    signupBtn.className = "auth-link-btn";
    signupBtn.textContent = "Sign up";
    signupBtn.addEventListener("click", () => openAuth("signup"));

    authActions.appendChild(loginBtn);
    authActions.appendChild(signupBtn);
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderAuthBar();
});

// ---------- render posts (realtime) ----------
function formatDateTime(timestamp){
  if (!timestamp) return "just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit"
  });
  return `${datePart} · ${timePart}`;
}

function renderPost(docSnap){
  const data = docSnap.data();
  const card = document.createElement("article");
  card.className = "post-card";
  card.style.setProperty("--tilt", `${(Math.random() * 2.4 - 1.2).toFixed(2)}deg`);

  const pin = document.createElement("div");
  pin.className = "pin-dot";
  card.appendChild(pin);

  if (data.text){
    const p = document.createElement("p");
    p.className = "post-text";
    p.textContent = data.text;
    card.appendChild(p);
  }

  if (data.imageUrl){
    const img = document.createElement("img");
    img.className = "post-image";
    img.src = data.imageUrl;
    img.alt = "post image";
    img.loading = "lazy";
    img.addEventListener("click", () => window.open(data.imageUrl, "_blank"));
    card.appendChild(img);
  }

  const foot = document.createElement("div");
  foot.className = "post-foot";
  const time = document.createElement("span");
  time.className = "post-time";
  time.textContent = formatDateTime(data.createdAt);
  foot.appendChild(time);
  card.appendChild(foot);

  return card;
}

function listenForPosts(){
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200));
  onSnapshot(q,
    (snapshot) => {
      loadingState.classList.add("hidden");
      board.innerHTML = "";

      if (snapshot.empty){
        board.appendChild(emptyState);
        return;
      }

      snapshot.forEach((docSnap) => {
        board.appendChild(renderPost(docSnap));
      });
    },
    (err) => {
      console.error(err);
      loadingState.textContent = "Couldn't load the board. Check your Firebase setup.";
    }
  );
}

listenForPosts();
