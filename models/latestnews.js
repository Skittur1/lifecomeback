const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestnewsSchema=new Schema({
    
    latestparagraph:String,
    createdAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    }
    
    
});
const latestnews=mongoose.model("latestnews",latestnewsSchema);
module.exports=latestnews;