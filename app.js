/*************** USERS (NỘI BỘ) ***************/
const USERS = {
  admin: { password: "123", role: "admin" },
  hungtv: { password: "123", role: "admin" },

  emp1: { password: "123", role: "employee" },
  thiendt: { password: "123", role: "employee" },
  khangpd: { password: "123", role: "employee" }
};

let currentUser = null;
let currentRole = null;

/*************** FIREBASE ***************/
/*************** FIREBASE CONFIG ***************/
const firebaseConfig = {
  apiKey: "AIzaSyAhl7xlN7QQHeTHvwo45g5vgOtFg70ajqI",
  authDomain: "greenkitchen-d9d32.firebaseapp.com",
  projectId: "greenkitchen-d9d32",
  storageBucket: "greenkitchen-d9d32.firebasestorage.app",
  messagingSenderId: "236883216262",
  appId: "1:236883216262:web:4a35a998824ccc72e18e07",
  measurementId: "G-ZV9BC0QFE3"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Firestore
const db = firebase.firestore();


/*************** LOGIN ***************/
window.login = function () {
  const u = username.value.trim().toLowerCase();
  const p = password.value.trim();

  if (!USERS[u] || USERS[u].password !== p) {
    alert("Sai tài khoản hoặc mật khẩu");
    return;
  }

  localStorage.setItem("user", u);
  localStorage.setItem("role", USERS[u].role);
  initApp(u, USERS[u].role);
};

window.logout = function () {
  localStorage.clear();
  location.reload();
};

window.addEventListener("DOMContentLoaded", () => {
  const u = localStorage.getItem("user");
  const r = localStorage.getItem("role");
  if (u && r) initApp(u, r);
});

function initApp(user, role) {
  currentUser = user;
  currentRole = role;

  loginBox.style.display = "none";
  app.style.display = "block";
  currentUser.innerText = user;

  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(e => e.remove());
  }

  loadInventory();
  loadHistory();
}

/*************** INVENTORY ***************/
function addItem() {
  const name = itemName.value.trim();
  const unit = itemUnit.value.trim();

  if (!name || !unit) {
    alert("Nhập đủ thông tin");
    return;
  }

  db.collection("inventory").add({
    name,
    unit,
    quantity: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  itemName.value = "";
  itemUnit.value = "";
}

function updateQty(id, delta, name) {
  const ref = db.collection("inventory").doc(id);

  ref.get().then(doc => {
    const newQty = doc.data().quantity + delta;
    ref.update({ quantity: newQty });

    addHistory(delta > 0 ? "Nhập" : "Xuất", name, Math.abs(delta));
  });
}

function deleteItem(id) {
  if (!confirm("Xóa mặt hàng này?")) return;
  db.collection("inventory").doc(id).delete();
}

function loadInventory() {
  db.collection("inventory").onSnapshot(snap => {
    inventoryBody.innerHTML = "";

    snap.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${d.name} (${d.unit})</td>
        <td>${d.quantity}</td>
        <td><button onclick="updateQty('${doc.id}', 1, '${d.name}')">+</button></td>
        <td><button onclick="updateQty('${doc.id}', -1, '${d.name}')">-</button></td>
        ${currentRole === "admin"
          ? `<td><button onclick="deleteItem('${doc.id}')">❌</button></td>`
          : ``}
      `;

      inventoryBody.appendChild(tr);
    });
  });
}

/*************** HISTORY ***************/
function addHistory(action, item, qty) {
  db.collection("history").add({
    time: firebase.firestore.FieldValue.serverTimestamp(),
    user: currentUser,
    action,
    item,
    qty
  });
}

function loadHistory() {
  db.collection("history")
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      historyBody.innerHTML = "";

      snap.forEach(doc => {
        const d = doc.data();
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${d.time?.toDate().toLocaleString() || ""}</td>
          <td>${d.user}</td>
          <td>${d.action}</td>
          <td>${d.item}</td>
          <td>${d.qty}</td>
        `;

        historyBody.appendChild(tr);
      });
    });
}
