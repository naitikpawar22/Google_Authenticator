const express = require("express");
const fs = require("fs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const usersFile = "users.json";

// Load users from file
function loadUsers() {
    if (!fs.existsSync(usersFile)) return {};
    return JSON.parse(fs.readFileSync(usersFile));
}

// Save users to file
function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Ensure "naitik" user exists
let users = loadUsers();
if (!users["naitik"]) {
    const secret = speakeasy.generateSecret({ name: "GoogleAuthApp" });
    users["naitik"] = { password: "@Naitik98", secret: secret.base32 };
    saveUsers(users);

    // Generate QR Code
    QRCode.toFile("public/static/qrcode.png", secret.otpauth_url, (err) => {
        if (err) console.log("QR Code Generation Error:", err);
    });
}

// 1️⃣ Serve Login Page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// 2️⃣ Handle Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    let users = loadUsers();

    if (users[username] && users[username].password === password) {
        res.json({ success: true, username });
    } else {
        res.json({ success: false, message: "Invalid Credentials" });
    }
});

// 3️⃣ Serve OTP Verification Page
app.get("/verify", (req, res) => {
    res.sendFile(__dirname + "/public/verify.html");
});

// 4️⃣ Handle OTP Verification
app.post("/verify", (req, res) => {
    const { username, otp } = req.body;
    let users = loadUsers();

    console.log("Received Username:", username);
    console.log("Received OTP:", otp);
    console.log("Users Data:", users);

    if (!users[username]) {
        return res.json({ success: false, message: "User not found" });
    }

    const secret = users[username].secret;
    console.log("User Secret:", secret);

    const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token: otp,
        window: 2, // Allow slight deviation
    });

    if (verified) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Invalid OTP" });
    }
});

// 5️⃣ Serve QR Code Page
app.get("/qr", (req, res) => {
    res.sendFile(__dirname + "/public/qr.html");
});

// 6️⃣ Serve Dashboard
app.get("/dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/dashboard.html");
});

// Start Server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
