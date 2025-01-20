import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary=async (localFilePath) =>{
    try{
        if(!localFilePath)  return console.log("Path does not exist ");

       const response= await  cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
         
        console.log("File is succesfully uploaded on cloudinary", response.url);
        return response
        
    } catch(error){
        fs.unlinkSync(localFilePath);// removing locally stored temporary files
        return null
    }
    
}

export {uploadOnCloudinary}