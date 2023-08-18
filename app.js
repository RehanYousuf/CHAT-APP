import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, where, onSnapshot, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4G96QG0XWUXsV9uWtd0Q8E8e6TBHZtuk",
    authDomain: "todo-app-313cf.firebaseapp.com",
    projectId: "todo-app-313cf",
    storageBucket: "todo-app-313cf.appspot.com",
    messagingSenderId: "1045941347571",
    appId: "1:1045941347571:web:a5297db4dc301a634e8386"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage();


const userProfile = document.getElementById("user-profile");


const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        const mountainsRef = ref(storage, `images/${file.name}`);
        const uploadTask = uploadBytesResumable(mountainsRef, file);
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                reject(error)
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    })
}

const getUserData = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        let fullName = document.getElementById("fullName")
        let email = document.getElementById("email")
        if (location.pathname === "/profile.html") {
            fullName.value = docSnap.data().fullName;
            email.value = docSnap.data().email;
            if (docSnap.data().picture) {
                userProfile.src = docSnap.data().picture
            }
        } else {
            fullName.innerHTML = docSnap.data().fullName;
            email.innerHTML = docSnap.data().email;
            if (docSnap.data().picture) {
                userProfile.src = docSnap.data().picture
            }
        }
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
}

onAuthStateChanged(auth, (user) => {
    const uid = localStorage.getItem("uid")
    if (user && uid) {
        console.log(user)
        getUserData(user.uid)
        getAllUsers(user.email)
        if (location.pathname !== '/profile.html' && location.pathname !== '/chat.html') {
            location.href = "profile.html"
        }
    } else {
        if (location.pathname !== '/index.html' && location.pathname !== "/register.html") {
            location.href = "index.html"
        }
    }
});


const logoutBtn = document.getElementById("logout-btn")

logoutBtn && logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        localStorage.clear()
        location.href = "index.html"
    }).catch((error) => {
        // An error happened.
    });

})


const registerBtn = document.getElementById('register-btn');

registerBtn && registerBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let fullName = document.getElementById("fullName")
    let email = document.getElementById("email")
    let password = document.getElementById("password")
    createUserWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            try {
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    fullName: fullName.value,
                    email: email.value,
                    password: password.value
                });
                Swal.fire({
                    icon: 'success',
                    title: 'User register successfully',
                })
                localStorage.setItem("uid", user.uid)
                location.href = "profile.html"
            } catch (err) {
                console.log(err)
            }
        })
        .catch((error) => {
            const errorMessage = error.message;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
            })
        });
})


const loginBtn = document.getElementById('login-btn');

loginBtn && loginBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let email = document.getElementById("email")
    let password = document.getElementById("password")
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            try {
                Swal.fire({
                    icon: 'success',
                    title: 'User login successfully',
                })
                localStorage.setItem("uid", userCredential.user.uid)
                location.href = "profile.html"
            } catch (err) {
                console.log(err)
            }
        })
        .catch((error) => {
            const errorMessage = error.message;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
            })
        });
})

const fileInput = document.getElementById("file-input");

fileInput && fileInput.addEventListener("change", () => {
    console.log(fileInput.files[0])
    userProfile.src = URL.createObjectURL(fileInput.files[0])
})

const updateProfile = document.getElementById("update-profile");

updateProfile && updateProfile.addEventListener("click", async () => {
    let uid = localStorage.getItem("uid")
    let fullName = document.getElementById("fullName")
    let email = document.getElementById("email")
    const imageUrl = await uploadFile(fileInput.files[0])
    const washingtonRef = doc(db, "users", uid);
    await updateDoc(washingtonRef, {
        fullName: fullName.value,
        email: email.value,
        picture: imageUrl
    });
    Swal.fire({
        icon: 'success',
        title: 'User updated successfully',
    })
})


const getAllUsers = async (email) => {
    const q = query(collection(db, "users"), where("email", "!=", email));
    const chatList = document.getElementById("chat-list")
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const { email, fullName, picture } = doc.data();
        chatList.innerHTML += `
                     <li onclick="selectChat('${email}','${fullName}','${picture}','${doc.id}')" class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">${fullName}</div>
                            <span class="user-email">${email}</span>
                        </div>
                    </li>`
    });
}

let selectUserId;

const selectChat = (email, fullName, picture, selectedId) => {
    selectUserId = selectedId;
    let currentUserId = localStorage.getItem('uid');
    let chatID;
    if (currentUserId < selectUserId) {
        chatID = currentUserId + selectUserId;
    } else {
        chatID = selectUserId + currentUserId;
    }
    const selectedUserProfile = document.getElementById("selected-user-profile");
    const selectedfullName = document.getElementById("selectedfullName");
    const selectedEmail = document.getElementById("selectedEmail");
    selectedfullName.innerHTML = fullName;
    selectedEmail.innerHTML = email;
    if (picture !== 'undefined') {
        selectedUserProfile.src = picture;
    } else {
        selectedUserProfile.src = 'images/user.png'
    }
    const chatContainer = document.getElementById("chatContainer");
    chatContainer.style.display = 'block';
    getAllMessages(chatID)
}


const messageInput = document.getElementById("message-input");

messageInput.addEventListener("keydown", async (e) => {
    if (e.keyCode === 13) {
        let currentUserId = localStorage.getItem('uid');
        let chatID;
        if (currentUserId < selectUserId) {
            chatID = currentUserId + selectUserId;
        } else {
            chatID = selectUserId + currentUserId;
        }
        const docRef = await addDoc(collection(db, "messages"), {
            message: messageInput.value,
            chatID: chatID,
            timestamp: serverTimestamp(),
            sender: currentUserId,
            receiver: selectUserId
        });
        messageInput.value = ""
        console.log("message sent")
    }
})



const getAllMessages = (chatID) => {
    const q = query(collection(db, "messages"), orderBy("timestamp"), where("chatID", "==", chatID));
    const chatBox = document.getElementById("chat-box")
    let currentUserId = localStorage.getItem('uid');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push(doc.data());
        });
        chatBox.innerHTML = "";
        for (var i = 0; i < messages.reverse().length; i++) {
            let time = moment(messages[i].timestamp.toDate()).fromNow();
            if (currentUserId === messages[i].sender) {
                chatBox.innerHTML += `<div class="message-box right-message mb-2">
                                       ${messages[i].message}
                                       <br />
                                       <span>${time}</span>
                                      </div>
                `
            } else {
                chatBox.innerHTML += `
                <div class="message-box left-message mb-2">
                ${messages[i].message}
                <br />
                <span>${time}</span>
                 </div>`
            }

            console.log("messages", messages);
        }
    });
}

window.selectChat = selectChat;