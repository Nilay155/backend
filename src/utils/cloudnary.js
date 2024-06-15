// It's A Process where File Comes From Server and then its uploaded to cloudnary
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // file system

(async function() {
    // Connecting to Cloudinary
    // Configuration
    cloudinary.config({ 
        cloud_name: "dmbi00yzt", 
        api_key: "118335242349298", 
        api_secret: "Ji1NdEFO3U-pjcKoW5qqvdcApLw" // Click 'View Credentials' below to copy your API secret
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
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary};