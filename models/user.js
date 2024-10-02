
const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const signingschema=new Schema({
    username:{
        type:String,
        required:true,
        unique:false,
       
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:Number,
        required:true,
        unique:true
    },
    dob:{
        type:Date,
        required:true,
        
    },
    address:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }

});
const signing=mongoose.model("signing",signingschema);
module.exports=signing;