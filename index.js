if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const moment = require('moment');
const multer = require('multer');
const { storage } = require('./cloudinary-config')
const upload = multer({ storage })
const Burrito = require('./models/burrito-model')
const PORT = 3000;

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
    console.log(burrito)
    res.render('burritos/display', { burrito })
});

app.listen(PORT, () => {
    console.log(`Escuchando a PORT ${PORT}.  Gracias.`);
});