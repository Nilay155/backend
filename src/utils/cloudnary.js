import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // file system

(async function() {
    // Configuration
    cloudinary.config({ 
        cloud_name: "dmbi00yzt", 
        api_key: "118335242349298", 
        api_secret: "<your_api_secret>" // Click 'View Credentials' below to copy your API secret
    });  
})();

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        });
        // file has been uploaded sucessfully
        console.log(`File is uploaded on cloudinary`,response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remov the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary};