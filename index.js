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
const port = process.env.PORT || 3000;

// Import models
const Burrito = require('./models/burrito-model')
const User = require('./models/user-model');

//------------Database Connection----------------------
mongoose.connect(process.env.MONGO_STRING, {
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

app.use((req, res, next) =>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use((req, res, next) => {
    res.locals.moment = moment;
    next();
})



//Begin ROUTES

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
    newBurrito.author = req.user._id;
    await newBurrito.save();
    // console.log(newBurrito)
    req.flash('success', 'Successfully posted new Burrito!');
    res.redirect('/burritos');
});

app.get('/burritos/:id', async(req, res) => {
    const burrito = await Burrito.findById(req.params.id).populate('author')
    // console.log(burrito);
    res.render('burritos/display', { burrito });
});

app.get('/burritos/:id/edit', async(req, res) => {
    const burrito = await Burrito.findById(req.params.id);
    res.render('burritos/edit', { burrito });
});

app.put('/burritos/:id', async(req, res) => {
    req.flash('success', 'Changes accepted.')
    const { id } = req.params;
    const burrito = await Burrito.findByIdAndUpdate(id, { ...req.body.burrito });
    res.redirect(`/burritos/${burrito._id}`);
});

app.delete('/burritos/:id', async(req, res) => {
    req.flash('success', 'YEETed that burrito.  It gone!');
    const { id } = req.params;
    const burrito = await Burrito.findByIdAndDelete(id);
    res.redirect('/burritos');
});

// Likes routes

app.put('/burritos/megusta/:id', async(req, res) => {
    req.flash('success', 'Me gusta...')
    const user = req.user;
    const { id } = req.params;
    if(user){
        const burrito = await Burrito.findByIdAndUpdate(id, { $inc: { megustas: 1}} )
    }
    console.log(` clicked MEGUSTA`);
    res.redirect('back');
});

app.put('/burritos/yeet/:id', async(req, res) => {
    // This successfully identifies the currently logged in user by their _id 
    const user = req.user._id;
    console.log(user)
    // This succussfully identifies the post (aka burrito)
    const { id } = req.params;
    // I have this just so I can console.log(burrito) at the bottom to see if the user has pushed to the array(alreadyOpinioned)
    const burrito = await Burrito.findById(req.params.id)
    // This is where it *should* push the user into the array.  It don't. :(
    const burritoUpdateOpinions = await Burrito.findByIdAndUpdate(id, { $push: {alreadyOpinioned: user}}, {new: true} )
    // If there *is* a logged in user, it will flash SUCCESS, and it successfully updates the disklikes("nomegustas") by 1
    if(user){
        req.flash('success', 'No te gusta...')
        const burritoPut = await Burrito.findByIdAndUpdate(id, { $inc: { nomegustas: 1}} )
    // Or it will flash ERROR and let you know you need to be logged in
    } else {
        req.flash('error', 'You must be logged in to have an opinion.')
    }
    // Printing for my own knowledge that the button got clicked and SOMETHING happened lol
    console.log(`clicked YEET`);
    // Printing for my own knowledge the entire burrito object so I can see that A.) the nomegustas property increased by 1 and B.) if the alreadyOpinioned array updated (which is isn't...so far)
    console.log(burrito)
    // Refreshes the displayed post, showing an updated ratio for the likes/dislikes
    res.redirect('back');
});


// Begin USERS routes

app.post('/users/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/users/login' }), (req, res) => {
    req.flash('success', 'Welcome back!')
    res.redirect('/burritos');
});

app.get('/users/login', (req, res) =>{
    res.render('users/login')
});

app.get('/users/register', (req, res) =>{
    res.render('users/register')
});

app.post('/users/register', async(req, res)=>{
    try {
        const { email, username, password } = req.body;
        const newUser = new User({ email, username });
        const regUser = await User.register(newUser, password);
        req.login(regUser, err => {
            if (err) return next(err);
            req.flash('success', `Bienvenidos, ${username}.`);
            res.redirect('/burritos');
        });
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('register');
    };
});

app.get('/users/logout', (req, res) =>{
    req.logout();
    req.flash('success', 'Adios, hasta pronto');
    res.redirect('/burritos')
});

// Obligatory listen method

app.listen(port, () => {
    console.log(`Escuchando a PORT (whatever port Heroku uses?).  Gracias.`);
});