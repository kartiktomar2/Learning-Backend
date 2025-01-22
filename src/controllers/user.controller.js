import {asyncHandler} from  '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import {User}  from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';


const generateAccessAndRefreshToken=async (userId)=>{

  try{
        const user= await User.findById(userId)
        const accessToken= await user.generateAccessToken();
        const refreshToken= await user.generateRefreshToken();

        user.refreshToken= refreshToken
        await  user.save({validateBeforeSave:false})

        return {accessToken,refreshToken};
  }
  catch(error){
       throw new ApiError(500,"something went wrong while generating refresh token")
  }
          
}

const registerUser= asyncHandler(async(req,res)=>{
         

    // registering user into database

    const{username,fullName,email,password}= req.body;
    
    // appplying validation for all fields

    if([username,fullName,email,password].some((field)=>field?.trim()===""))
    {
        throw new ApiError(400,"All field are required")
    }
      if(!email.includes('@'))
      {
        throw new ApiError(404,"please provide valid email")
      }
   
      
      // checking if user already exists or not 
   const existedUser = await User.findOne({
           $or:[{username},{email}]
   })
   if(existedUser)
   {
    throw new ApiError(409,"this user already exists")
   }

   //handling images,  as we have now introduced middleware it gives us access to more functionality
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let  coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0)
    {
      coverImageLocalPath=req.files.coverImage[0].path;
    }
     
     if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
     }
    
     const avatar= await uploadOnCloudinary(avatarLocalPath)
     const coverImage= await uploadOnCloudinary(coverImageLocalPath)

     if(!avatar){
        throw new ApiError(400,"avatar file is required")
     }

    const user=await  User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
     })

      const createdUser =await User.findById(user._id).select("-password -refreshToken")

      if(!createdUser){
        throw new ApiError(500,"something went wrong while registring the user")
      }

      return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered succesfully")
      )
})


const loginUser = asyncHandler(async(req,res)=>{
        const {username,email,password}= req.body
        if(!username && !email)
        {
            throw new ApiError(400,"username or email is required")
        }

        // finding useranme or email in the database
         const user= await User.findOne({
               $or:[{username},{email}]
         })
          
         // checking if user exists or not 
         if(!user)
         {
          throw new ApiError(404,"this user does not exists")
         }

         // now validating the password
        const isPasswordValid= await user.isPasswordCorrect(password)
        if(!isPasswordValid)
        {
          throw new ApiError(401,"password is not correct")
        }


        const {accessToken,refreshToken}= await  generateAccessAndRefreshToken(user._id)
        const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

        const options={
            httpOnly:true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken",refreshToken.options)
        .json(new ApiResponse(200,
          {
            user:loggedInUser,accessToken,refreshToken
          },
          "user logged in Successfully"
        ))
})

const logoutUser= asyncHandler(async(req,res)=>{
     await  User.findByIdAndDelete(
      req.user._id,
      {
        $set:{refreshToken:undefined}
      },
      {
        new:true
      }
     )
     const options={
      httpOnly:true,
      secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logout Succesfully "))
})

export {registerUser,loginUser,logoutUser}