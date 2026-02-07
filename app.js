/*************** USERS ***************/
const USERS = {
  admin: { password: "123", role: "admin" },

  emp01: { password: "123", role: "employee" },
  emp02: { password: "123", role: "employee" },
  emp03: { password: "123", role: "employee" },
  emp04: { password: "123", role: "employee" },
  emp05: { password: "123", role: "employee" }
};

/*************** FIREBASE ***************/
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
});

const db = firebase.firestore();

let currentUser = null;
let currentRole = null;

/*************** LOGIN ***************/
function login() {
  const u = username.value.trim().toLowerCase();
  const p = password.value.trim();

  if (!USERS[u] || USERS[u].password !== p) {
    alert("Sai tài khoản hoặc mật khẩu");
    return;
  }

  localStorage.setItem("user", u);
  localStorage.setItem("role", USERS[u].role);
  initApp(u, USERS[u].role);
}

function logout() {
  localStorage.clear();
  location.reload();
}

window.onload = () => {
  const u = localStorage.getItem("user");
  const r = localStorage.getItem("role");
  if (u && r) initApp(u, r);
};

function initApp(user, role) {
  currentUser = user;
  currentRole = role;

  loginBox.style.display = "none";
  app.style.display = "block";

  if (role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(e => e.remove());
  }

  loadItems();
  loadHistory();
}

/*************** ITEMS ***************/
function addItem() {
  if (currentRole !== "admin") return;

  const name = itemName.value.trim();
  const unit = itemUnit.value.trim();

  if (!name || !unit) {
    alert("Nhập đầy đủ thông tin");
    return;
  }

  db.collection("items").add({
    name,
    unit,
    quantity: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  itemName.value = "";
  itemUnit.value = "";
}

function loadItems() {
  db.collection("items").onSnapshot(snap => {
    itemBody.innerHTML = "";

    snap.forEach(doc => {
      const d = doc.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.unit}</td>
        <td>${d.quantity}</td>
        <td>
          <input type="number" min="1" id="in-${doc.id}">
          <button onclick="importItem('${doc.id}','${d.name}',${d.quantity})">+</button>
        </td>
        <td>
          <input type="number" min="1" id="out-${doc.id}">
          <button onclick="exportItem('${doc.id}','${d.name}',${d.quantity})">-</button>
        </td>
      `;
      itemBody.appendChild(tr);
    });
  });
}

/*************** IMPORT / EXPORT ***************/
function importItem(id, name, qty) {
  const amount = Number(document.getElementById("in-" + id).value);
  if (!amount) return;

  updateStock(id, name, "import", amount, qty);
}

function exportItem(id, name, qty) {
  const amount = Number(document.getElementById("out-" + id).value);
  if (!amount) return;

  if (qty < amount) {
    alert("Không đủ tồn kho");
    return;
  }

  updateStock(id, name, "export", amount, qty);
}

function updateStock(id, name, type, amount, qty) {
  const newQty = type === "import" ? qty + amount : qty - amount;

  db.collection("items").doc(id).update({
    quantity: newQty
  });

  db.collection("inventory_history").add({
    itemId: id,
    itemName: name,
    type,
    quantity: amount,
    employee: currentUser,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/*************** HISTORY ***************/
function loadHistory() {
  db.collection("inventory_history")
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      historyBody.innerHTML = "";

      snap.forEach(doc => {
        const d = doc.data();
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${d.employee}</td>
          <td>${d.itemName}</td>
          <td>${d.type === "import" ? "Nhập" : "Xuất"}</td>
          <td>${d.quantity}</td>
          <td>${d.time.toDate().toLocaleString()}</td>
        `;

        historyBody.appendChild(tr);
      });
    });
}
