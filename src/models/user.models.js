import mongoose, { mongo } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            required : true,
            lowercase : true,
            trim : true,
            unique : true,
            index : true, // Searching main help karta hain
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        fullname : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, // cloundinary url for images,files,videos
            required : true,
        },
        coverImage : {
            type : String,
        },
        watchHistory :[
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true,'Password is required'],// custom message given
        },
        refreshToken : {
            type : String
        }
    },
    {
        timestamps : true, // Created and Updated at timeline
    }
)
// Password handling using bcrypt
userSchema.pre("save", async function(next) { // arrow function mat use karna cause context chaiye callback function main
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,13);
    }
    next();
})

// Adding Our Own Customised Method
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password); // returns true or false
}

// JWT TOKENS -> Used For Authorization to Communicate Securely
// JWT TOKENS -> Access Tokens and Refresh Tokens
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model('User',userSchema);