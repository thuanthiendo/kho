/************ FIREBASE ************/
firebase.initializeApp({
  apiKey: "AIzaSyAhl7xlN7QQHeTHvwo45g5vgOtFg70ajqI",
  authDomain: "greenkitchen-d9d32.firebaseapp.com",
  projectId: "greenkitchen-d9d32"
});

const db = firebase.firestore();

/************ AUTH ************/
let currentUser = null;

window.login = () => {
  const u = username.value.trim();
  if (!u) return alert("Nhập tên nhân viên");

  currentUser = u;
  localStorage.setItem("user", u);

  loginBox.style.display = "none";
  app.style.display = "block";
  document.getElementById("currentUser").textContent = u;

  loadItems();
  loadHistory();
};

window.logout = () => {
  localStorage.clear();
  location.reload();
};

window.addEventListener("DOMContentLoaded", () => {
  const u = localStorage.getItem("user");
  if (u) {
    currentUser = u;
    loginBox.style.display = "none";
    app.style.display = "block";
    document.getElementById("currentUser").textContent = u;
    loadItems();
    loadHistory();
  }
});

/************ HISTORY ************/
function addHistory(action, item, qty = "") {
  db.collection("history").add({
    employee: currentUser,
    action,
    item,
    quantity: qty,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/************ ITEMS ************/
function addItem() {
  const name = itemName.value.trim();
  const unit = itemUnit.value.trim();
  if (!name || !unit) return alert("Nhập đủ thông tin");

  db.collection("items").add({
    name,
    unit,
    stock: 0
  });

  addHistory("THÊM MẶT HÀNG", name);

  itemName.value = "";
  itemUnit.value = "";
}

function loadItems() {
  db.collection("items").onSnapshot(snap => {
    inventoryBody.innerHTML = "";

    snap.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${d.name} (${d.unit})</td>
        <td>${d.stock}</td>
        <td><input type="number" min="1" id="in-${doc.id}"></td>
        <td><input type="number" min="1" id="out-${doc.id}"></td>
        <td></td>
      `;

      const btnIn = document.createElement("button");
      btnIn.textContent = "Nhập";
      btnIn.onclick = () => changeStock(doc.id, d.name, "NHẬP");

      const btnOut = document.createElement("button");
      btnOut.textContent = "Xuất";
      btnOut.onclick = () => changeStock(doc.id, d.name, "XUẤT");

      const btnDel = document.createElement("button");
      btnDel.textContent = "❌";
      btnDel.onclick = () => deleteItem(doc.id, d.name);

      tr.children[2].appendChild(btnIn);
      tr.children[3].appendChild(btnOut);
      tr.children[4].appendChild(btnDel);

      inventoryBody.appendChild(tr);
    });
  });
}

function changeStock(id, name, action) {
  const input = document.getElementById(
    action === "NHẬP" ? `in-${id}` : `out-${id}`
  );
  const qty = Number(input.value);
  if (qty <= 0) return alert("Số lượng không hợp lệ");

  const ref = db.collection("items").doc(id);

  db.runTransaction(async t => {
    const doc = await t.get(ref);
    let stock = doc.data().stock;

    if (action === "XUẤT" && stock < qty) {
      throw "Không đủ hàng";
    }

    stock = action === "NHẬP" ? stock + qty : stock - qty;
    t.update(ref, { stock });
  }).then(() => {
    addHistory(action, name, qty);
    input.value = "";
  }).catch(err => alert(err));
}

function deleteItem(id, name) {
  if (!confirm("Xóa mặt hàng này?")) return;

  db.collection("items").doc(id).delete();
  addHistory("XÓA MẶT HÀNG", name);
}

/************ LOAD HISTORY ************/
function loadHistory() {
  db.collection("history")
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      historyBody.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.time?.toDate().toLocaleString()}</td>
          <td>${d.employee}</td>
          <td>${d.action}</td>
          <td>${d.item}</td>
          <td>${d.quantity}</td>
        `;
        historyBody.appendChild(tr);
      });
    });
}
