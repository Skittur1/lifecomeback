const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestnewsSchema=new Schema({
    
    latestparagraph:String,

    image: {
        data: Buffer,  // Store image as binary data
        contentType: String  // To store file format (e.g., 'image/png')
    },

    createdAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    }
    
    
});
const latestnews=mongoose.model("latestnews",latestnewsSchema);
module.exports=latestnews;