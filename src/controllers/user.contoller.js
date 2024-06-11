import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import {uploadOnCloudinary} from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const validation = (property) => {
    if(property === ""){
        return new ApiError(400,`${property} is missing`)
    } else {
        return null;
    }
}
const registerUser = asyncHandler(async (req,res) => {
    // get user data from frontend/postman
    // validation of details
    // check if user already exists -> username and email
    // check for images, check for avatar->required
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token filed from response
    // check for user creation
    // return response

    const {username,fullname,email,password} = req.body;
    console.log(fullname,username,email,password);

    const fn = validation(fullname);
    const em = validation(email);
    const un = validation(username);
    const pass = validation(password);

    if(fn !== null) throw fn;
    if(em !== null) throw em;
    if(un !== null) throw un;
    if(pass !== null) throw pass;

    const existingUser = await User.findOne({
        $or : [{ username },{ email }]
    })

    if(existingUser) {
        throw new ApiError(409,"User with exisiting details");
    }
    
    // multer gives access to files option
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avator required");
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath); // uploading is a time cosuming process
    

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        
    } else {
        coverImageLocalPath = "";
    }
    const coverUpload = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatarUpload) {
        throw new ApiError(400,"Avator file is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatarUpload.url,
        coverImage : coverUpload?.url || "",
        username : username.toLowerCase(),
        email,
        password
        
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something wrong while registring the user");
    } 

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Sucessfully")
    )
} )
const generateTokens = async (userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false}); // saving the user without validation
        return {accessToken,refreshToken};
    } catch(error) {
        console.log(`Error in generating tokens`,error);
    }
};
const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generation
    // send cookie

    const {username,email,password} = req.body;
    
    if(!username || !email) {
        throw new ApiError(400,"username or password is required");
    }

    const user = await User.findOne({ // instance of the object from the database
        $or : [{username},{email}]
    })
    if(!user) {
        throw new ApiError(404,"User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(isPasswordCorrect) {
        const tokens = await generateTokens(user._id);
    } else {
        throw new ApiError(404,"Incorrect Password");
    }

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = { // security
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken",tokens.accessToken,options)
    .cookie("refreshToken",tokens.refreshToken,options)
    .json(
        new ApiResponse(200,{
            user : loggedInUser,
            refreshToken : (tokens.refreshToken),
            accessToken : (tokens.accessToken)
        })
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    res
    .status(200)
    .clearCookie("accessTokend",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"User LoggedOut Sucessfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
}