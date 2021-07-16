const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BurritoSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    image: [{
            url: String,
            filename: String
        }],
    restaurant: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    megustas: {
        type: Number,
        // required: true,
    },
    nomegustas: {
        type: Number,
        // required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    aleadyOpinioned: [{
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }],
})

module.exports = mongoose.model('Burrito', BurritoSchema)