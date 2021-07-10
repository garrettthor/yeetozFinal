if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocal = require('passport-local');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const moment = require('moment');
const multer = require('multer');
const { storage } = require('./cloudinary-config')
const upload = multer({ storage })
const PORT = 3000;

// Import models
const Burrito = require('./models/burrito-model')
const User = require('./models/user-model');

//------------Database Connection----------------------
mongoose.connect('mongodb://localhost:27017/yeetoz3', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión:'));
db.once('open', () => {
    console.log(`Hola, estamos conectados a ${db.name}.`);
});
//------------End db connection stuff------------------

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session and flash
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7),  // 1 week expiration
        maxAge: (1000 * 60 * 60 * 24 * 7)
    }
    // store:
}
app.use(session(sessionConfig));
app.use(flash());

//Passport and local strategy
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.moment = moment;
    next();
})

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/burritos', async(req, res) => {
    const burritos = await Burrito.find({})
    burritos.sort((a, b) => b.createdAt-a.createdAt);
    res.render('burritos/feed', { burritos });
});

app.get('/burritos/new', (req, res) => {
    res.render('burritos/new');
});

app.post('/burritos', upload.single('image'), async(req, res) => {
    const newBurrito = new Burrito(req.body.burrito);
    newBurrito.image = ({ url: req.file.path, filename: req.file.filename });
    // newBurrito.author = req.user._id;
    await newBurrito.save();
    // console.log(newBurrito)
    res.redirect('/burritos')
});

app.get('/burritos/:id', async(req, res) => {
    const burrito = await Burrito.findById(req.params.id)
    // console.log(burrito)
    res.render('burritos/display', { burrito })
});

app.get('/users/login', (req, res) =>{
    res.render('users/login')
});

app.get('/users/register', (req, res) =>{
    res.render('users/register')
});

app.post('/users/register', async(req, res)=>{
    const newUser = new User(req.body.user)
    await newUser.save();
    res.redirect('/burritos')
})



app.listen(PORT, () => {
    console.log(`Escuchando a PORT ${PORT}.  Gracias.`);
});