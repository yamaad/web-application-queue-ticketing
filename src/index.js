//*imports
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

//*firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBhzwJ-UyLhjYG5eTaxbFBzcdI140ahNHM",
  authDomain: "fir-9-acf09.firebaseapp.com",
  projectId: "fir-9-acf09",
  storageBucket: "fir-9-acf09.appspot.com",
  messagingSenderId: "389175473794",
  appId: "1:389175473794:web:2d708dc15de44d1b24a69b",
};

//* inintialize firebase app
initializeApp(firebaseConfig);

//*nitialize firesbaseservices
const dataBase = getFirestore();

// * classes
//* Queue class
class Queue {
  constructor(lastNo, nowServing, queueSize) {
    this.lastNo = lastNo;
    this.nowServing = nowServing;
    this.queueSize = queueSize;
  }
}
//*CountersClass
class Counter {
  constructor(online, currNum, serve) {
    this.online = online;
    this.currNum = currNum;
    this.serve = serve;
  }
}
// * return data from firestore to object
const convertQueueData = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Queue(data.lastNo, data.nowServing, data.queueSize);
  },
};
const convertCounterData = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Counter(data.online, data.currNum, data.serve);
  },
};

//* get queue data
const queueDoc = doc(dataBase, "queue", "queueUpdate");
async function getQueueData() {
  const ref = queueDoc.withConverter(convertQueueData);
  const dataSnap = await getDoc(ref);
  if (dataSnap.exists()) {
    const queue = dataSnap.data();
    return queue;
  } else {
    console.log("Queue data is lost!");
    await updateQueue(0, 0, 0);
    await getQueueData();
  }
}
//* get counters data
async function getCounterData(docc) {
  const ref = doc(dataBase, "counters", docc).withConverter(convertCounterData);
  const dataSnap = await getDoc(ref);
  if (dataSnap.exists()) {
    const counters = dataSnap.data();

    return counters;
  } else {
    console.log("there's error here");
  }
}
//*update counter online
const countersDoc = collection(dataBase, "counters");
onSnapshot(countersDoc, async (snapshot) => {
  var countersData;
  snapshot.docs.forEach((docc) => {
    countersData = doc(dataBase, "counters", docc.id);
    onSnapshot(countersData, async () => {
      var data = await getCounterData(docc.id);
      var stat = document.getElementById(docc.id);
      if (stat) {
        var serving = document.getElementById(stat.id + "-dot");
        var greyed = document.getElementById(stat.id + "cont");
        if (data.online) {
          stat.innerHTML = data.currNum;
          serving.classList.remove("red-dot");
          serving.classList.add("green-dot");
          greyed.classList.remove("offline");
          if (data.serve) {
            serving.classList.remove("green-dot");
            serving.classList.add("red-dot");
          }
        } else if (!data.online) {
          serving.classList.remove("red-dot");
          serving.classList.remove("green-dot");
          greyed.classList.add("offline");
          stat.innerHTML = "offline";
        }
      }
    });
  });
});

//* Now Serving & latest Number
onSnapshot(queueDoc, async () => {
  var queueData = await getQueueData();
  var nowServing = document.querySelector(".now-serving");
  if (nowServing) {
    nowServing.innerHTML = "Now Serving: " + queueData.nowServing;
  }
  var lastNo = document.querySelector(".latest-Number");
  if (lastNo) {
    lastNo.innerHTML = "Latest Number: " + queueData.lastNo;
  }
});

//* generate queue
async function updateQueue(lastNo, nowServing, queueSize) {
  await setDoc(queueDoc, {
    lastNo: lastNo,
    nowServing: nowServing,
    queueSize: queueSize,
  });
}

//*take a number
const takeNo = document.querySelector(".add");
if (takeNo) {
  if (sessionStorage.getItem("TicketNo")) {
    takeNo.value = sessionStorage.getItem("TicketNo");
    takeNo.disabled = true;
  } else {
    takeNo.addEventListener("click", async () => {
      takeNo.disabled = true;
      takeNo.value = "welcome, please wait for you number";
      var queueData = await getQueueData();
      queueData.lastNo++;
      queueData.queueSize++;
      const docRef = await addDoc(collection(dataBase, "customerNo"), {
        no: queueData.lastNo,
        createdAt: serverTimestamp(),
      });
      sessionStorage.setItem("TicketNo", "TICKET NO:\n" + queueData.lastNo);
      takeNo.value = "TICKET NO:\n" + queueData.lastNo;
      await updateQueue(
        queueData.lastNo,
        queueData.nowServing,
        queueData.queueSize
      );
    });
  }
}

//! managment counter
const clickBtn = document.getElementById("management-counter");
onSnapshot(countersDoc, (snapshot) => {
  var i = 0;
  snapshot.docs.forEach(async (doc) => {
    const counter = await getCounterData(doc.id);
    i++;
    const onlineId = document.getElementById("btn1-" + i.toString());
    const compCurrId = document.getElementById("btn2-" + i.toString());
    const callNextId = document.getElementById("btn3-" + i.toString());
    if (onlineId) {
      if (counter.online) {
        onlineId.value = "go offline";
        onlineId.classList.add("go-offline");
        if (counter.serve) {
          compCurrId.disabled = false;
          callNextId.disabled = true;
        } else {
          compCurrId.disabled = true;
          callNextId.disabled = false;
        }
      } else {
        onlineId.value = "go online";
        onlineId.classList.remove("go-offline");
        compCurrId.disabled = true;
        callNextId.disabled = true;
      }
    }
  });
});
if (clickBtn) {
  clickBtn.addEventListener("click", async function (e) {
    //*online || offline
    const counter = await getCounterData("counter" + e.target.name);
    if (
      e.target &&
      (e.target.className == "btn1" || e.target.className == "btn1 go-offline")
    ) {
      await updateDoc(doc(dataBase, "counters", "counter" + e.target.name), {
        online: !counter.online,
      });
    }
    if (e.target && e.target.className == "btn3") {
      var queueData = await getQueueData();
      if (queueData.queueSize == 0) {
        alert("No tickets in the waiting queue");
      } else {
        queueData.queueSize--;
        queueData.nowServing++;
        updateQueue(
          queueData.lastNo,
          queueData.nowServing,
          queueData.queueSize
        );
        await updateDoc(doc(dataBase, "counters", "counter" + e.target.name), {
          serve: true,
          currNum: queueData.nowServing,
        });
        const customerID = query(
          collection(dataBase, "customerNo"),
          where("no", "==", queueData.nowServing)
        );
        onSnapshot(customerID, (snapshot) => {
          snapshot.docs.forEach(async (docc) => {
            await deleteDoc(doc(dataBase, "customerNo", docc.id));
          });
        });
      }
    }
    if (e.target && e.target.className == "btn2") {
      await updateDoc(doc(dataBase, "counters", "counter" + e.target.name), {
        serve: false,
      });
    }
  });
}
