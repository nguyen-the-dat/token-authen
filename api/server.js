const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const {base64url} = require("./helpers");
const app = express();
const port = 3000;
app.use(cors({
    origin: 'http://localhost:5174',
    credentials: true,
}))
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const jwtSecret = 'HzqAR0jW6UlRJwoD4/feIp3QKQC4XoIsgiQJl9jHbwyWdCPF3QcFwdgmymdvom2nxo/qKfqK9DUWBKUuy8kTNYJ6motEiTjl9zhANt1IKfSq3Tp6xq0HhkTF96XZZRR9YjWTILkhUSpROK4HxgCl758nC5HwrgoCq38rKSEy4SjZ19UqrHFxm+13cUjHuD3YrFOC9C/zZMrdOA58/Khw3335ny7zcCVRqYk9RkgVMEPYt3uJHPNWa/SK2VJhcS9nAOhTK5UehXl7gxMW0dXJkdrQvxc1PDnj6R70dIBQ2FOT/taEG8L+F+5IRyRfY/7uAxdb1nie+CXhViowLEjPPQ==';
const db = {
    users: [
        {
            id: 1,
            email: "nguyenvana@gmail.com",
            password: "123456",
            name: "Nguyen Van A"
        }
    ],
    posts: [
        {
            id: 1,
            title: 'Title 1',
            description: 'Description 1',
        },
        {
            id: 2,
            title: 'Title 2',
            description: 'Description 2',
        },
        {
            id: 3,
            title: 'Title 3',
            description: 'Description 3',
        }
    ]
}

app.get('/api/posts', (req, res) => {
    res.json(db.posts);
})


app.post('/api/auth/login', (req, res) => {
    const {email, password} = req.body;
    const user = db.users.find(user => user.email === email && user.password === password);
    if (!user) {

        res.status(401).json({
            message: 'Unauthorized',
        })
    }

    const header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    const payload = {
        sub: user.id,
        exp: Date.now() + 3600000
    }
    // 2. ma hoa base64 (json(header & payload))
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));

    // 3. tao token data <header>.<payload>
    const tokenData = `${encodedHeader}.${encodedPayload}`;

    // 4. Tao chu ky
    const hmac = crypto.createHmac("sha256", jwtSecret);
    const signature = hmac.update(tokenData).digest("base64url");
    res.json({
        token: `${tokenData}.${signature}`
    })
})

// app.get('/api/auth/logout', (req, res) => {
//     delete sessions[req.cookies.sessionId];
//     res.setHeader('Set-Cookie', `sessionId=; max-age=0`).redirect('/api/auth/login');
// })

app.get('/api/auth/me', (req, res) => {

    const token = req.headers.authorization?.slice(7);
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const [encodedHeader, encodedPayload, tokenSignature] = token.split('.');
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac("sha256", jwtSecret);
    const signature = hmac.update(tokenData).digest("base64url");
    if (signature !== tokenSignature) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
    const payload = JSON.parse(atob(encodedPayload));
    const user = db.users.find(user => user.id === payload.sub);
    if (!user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
    if(payload.exp < Date.now()){
        return res.status(401).json({
            message: "Token is expried"
        })
    }
    res.json(user)

})

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
})