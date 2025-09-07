import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";

export const signup = async (req, res)=>{
    const {name, password, email} = req.body;
    try {
        if (password.length<6){
            return res.status(400).json({message: "Enter more than 6 digits"});
        }
        const user = await User.findOne({email})
        if (user) return res.status(400).json({message: "User already Registered"});

        const salt = await bcrypt.genSalt(10)
        const hashpass = await bcrypt.hash(password, salt)

        const newUser = new User({
            name,
            email,
            password:hashpass,
        })

        if (newUser){
            generateToken(newUser._id,res)
            await newUser.save();

            res.status(201).json({
             _id: newUser._id,
             name: newUser.name,
             email: newUser.email,
             profilepic: newUser.profilepic
        });
        } else (
            res.status(400).json({message: "Invalid User Data"})
        )
    
    } catch (error) {
        console.log("eror while validating", error)
        res.status(500).json({message: "Internal Server Error"})
    }
};
export const login = async (req, res)=>{
    const {email, password}=req.body;
    try {
        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "Wrong credentials"});
        }
            
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect){
            return res.status(400).json({message: "Wrong credentials"});
        }

        generateToken(user._id,res)

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilepic: user.profilepic
        })
    } catch (error) {
        console.log("Unable to login")
        res.status(500).json({message: "Internal Server Error"});
        
    }
};

export const logout = (req, res)=>{
    try {
        res.cookie("myToken","", {
            maxAge:"0",
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
        res.status(200).json({message: "User Logged out Succefully"});
    } catch (error) {
        
    }
};
export const updateProfile = async (req, res) => {
    try {
      const { profilepic } = req.body;
      const userId = req.user._id;
  
      if (!profilepic) {
        return res.status(400).json({ message: "Profile Pic Not found" });
      }
  
      const base64Data = profilepic.startsWith('data:image/') ? profilepic : `data:image/png;base64,${profilepic}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Data);
      const uploadUser = await User.findByIdAndUpdate(userId, { profilepic: uploadResponse.secure_url }, { new: true });
  
      return res.status(200).json(uploadUser);
    } catch (error) {
      console.log("Error while uploading: ", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
};
export const checkAuth = (req, res) =>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in Authentication Check", error)
        res.status(500).json({message: "Internal Server Error"});
    }
};