const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')// imported the mongoose-paginate

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        maxlength: [30, 'Name Cannot Exceed 30 Characters']
    },
    description: {
        type: String,
        required: [true, 'Description is Required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price Cannot be Negative']
    }
});

productSchema.plugin(mongoosePaginate);// use the plugin
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
