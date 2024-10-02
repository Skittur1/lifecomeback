const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestSchema=new Schema({
    title:{
        type:String,
       
        
    },
    description:{
        type: String,
    },
    h:{
        type: String,
        
    },
    h1:{
        type: String,

    },
    h1para:{
        type: String,
    },
    h2:{
        type: String,
    },
    h2para:{

        type: String,
    },
    h3:{
        type: String,
    },
    h3para:{
        type: String,
    },
    p:{
        type: String,
    },
    p1:{
        type: String,
    },
    p1para:{
        type: String,
    },
    p2:{
        type: String,
    },
    p2para:{
        type: String,
    },
    p3:{
        type: String,
    },
    p3para:{
        type: String,
    },

    image: {
        data: Buffer,  // Store image as binary data
        contentType: String  // To store file format (e.g., 'image/png')
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    },
    link:{
        type: String,
        
    }
});
const latest=mongoose.model("latest",latestSchema);
module.exports=latest;