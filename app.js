// ===== FIREBASE IMPORT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===== CONFIG (THAY BẰNG CONFIG CỦA BẠN) =====
const firebaseConfig = {
  apiKey: "AIzaSyAhl7xlN7QQHeTHvwo45g5vgOtFg70ajqI",
  authDomain: "greenkitchen-d9d32.firebaseapp.com",
  projectId: "greenkitchen-d9d32",
  storageBucket: "greenkitchen-d9d32.firebasestorage.app",
  messagingSenderId: "236883216262",
  appId: "1:236883216262:web:4a35a998824ccc72e18e07",
  measurementId: "G-ZV9BC0QFE3"
};

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM =====
const loginBox = document.getElementById("loginBox");
const appBox = document.getElementById("app");
const currentUserEl = document.getElementById("currentUser");
const inventoryBody = document.getElementById("inventoryBody");
const historyBody = document.getElementById("historyBody");

// ===== LOGIN =====
document.getElementById("loginBtn").onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    loginError.innerText = e.message;
  }
};

// ===== LOGOUT =====
document.getElementById("logoutBtn").onclick = () => signOut(auth);

// ===== AUTH STATE =====
onAuthStateChanged(auth, user => {
  if (user) {
    loginBox.style.display = "none";
    appBox.style.display = "block";
    currentUserEl.innerText = user.email;
    loadInventory();
    loadHistory();
  } else {
    loginBox.style.display = "block";
    appBox.style.display = "none";
  }
});

// ===== ADD ITEM =====
document.getElementById("addItemBtn").onclick = async () => {
  const name = itemName.value.trim();
  const unit = itemUnit.value.trim();
  if (!name || !unit) return alert("Nhập đủ thông tin");

  await addDoc(collection(db, "inventory"), {
    name,
    unit,
    quantity: 0,
    createdAt: serverTimestamp()
  });

  await addHistory("Tạo mặt hàng", name, 0);
  itemName.value = "";
  itemUnit.value = "";
};

// ===== LOAD INVENTORY =====
function loadInventory() {
  onSnapshot(collection(db, "inventory"), snap => {
    inventoryBody.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.quantity}</td>
        <td><button onclick="changeQty('${docSnap.id}', 1)">+</button></td>
        <td><button onclick="changeQty('${docSnap.id}', -1)">-</button></td>
        <td><button onclick="removeItem('${docSnap.id}', '${d.name}')">❌</button></td>
      `;
      inventoryBody.appendChild(tr);
    });
  });
}

// ===== CHANGE QTY =====
window.changeQty = async (id, delta) => {
  const ref = doc(db, "inventory", id);
  await updateDoc(ref, {
    quantity: delta
  });

  await addHistory(delta > 0 ? "Nhập kho" : "Xuất kho", id, delta);
};

// ===== DELETE =====
window.removeItem = async (id, name) => {
  if (!confirm("Xóa mặt hàng?")) return;
  await deleteDoc(doc(db, "inventory", id));
  await addHistory("Xóa mặt hàng", name, 0);
};

// ===== HISTORY =====
async function addHistory(action, item, qty) {
  await addDoc(collection(db, "history"), {
    user: auth.currentUser.email,
    action,
    item,
    quantity: qty,
    time: serverTimestamp()
  });
}

function loadHistory() {
  onSnapshot(collection(db, "history"), snap => {
    historyBody.innerHTML = "";
    snap.forEach(d => {
      const h = d.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.time?.toDate().toLocaleString()}</td>
        <td>${h.user}</td>
        <td>${h.action}</td>
        <td>${h.item}</td>
        <td>${h.quantity}</td>
      `;
      historyBody.appendChild(tr);
    });
  });
}
