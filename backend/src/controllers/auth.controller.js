import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import Room from "../models/room.model.js";
import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";
import { isValidTtl } from "../lib/roomTtl.js";
import { deleteRoomAndMessages } from "./room.controller.js";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

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
            await newUser.save();

            const token = generateToken(newUser._id)

            res.status(201).json({
             token,
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

        const token = generateToken(user._id)

        res.status(200).json({
            token,
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
            maxAge: 0,
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

export const updateAccount = async (req, res) => {
    try {
        const { name, defaultRoomTtlHours } = req.body;
        const updates = {};

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!USERNAME_PATTERN.test(trimmed)) {
                return res.status(400).json({
                    message: "Username must be 3-30 characters: letters, numbers, dots, dashes or underscores",
                });
            }
            if (trimmed !== req.user.name) {
                const taken = await User.exists({ name: trimmed, _id: { $ne: req.user._id } });
                if (taken) return res.status(409).json({ message: "That username is already taken" });
                updates.name = trimmed;
            }
        }

        if (defaultRoomTtlHours !== undefined) {
            if (!isValidTtl(defaultRoomTtlHours)) {
                return res.status(400).json({ message: "Invalid room lifetime" });
            }
            updates.defaultRoomTtlHours = Number(defaultRoomTtlHours);
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        console.log("Error updating account: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { confirmation } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (confirmation !== `sudo delete ${user.name}`) {
            return res.status(400).json({ message: `Type "sudo delete ${user.name}" to confirm` });
        }

        // Rooms this user created are deleted along with their messages.
        const ownedRooms = await Room.find({ createdBy: user._id });
        for (const room of ownedRooms) {
            await deleteRoomAndMessages(room, user._id);
        }

        // In rooms they only joined, remove them and let the others know.
        const joinedRooms = await Room.find({ members: user._id });
        for (const room of joinedRooms) {
            room.members = room.members.filter((m) => m.toString() !== user._id.toString());
            await room.save();
            const sysMsg = await Message.create({
                room: room._id,
                type: "system",
                text: `${user.name} deleted their account`,
            });
            io.to(room._id.toString()).emit("message", sysMsg);
        }

        await Message.deleteMany({ sender: user._id });
        await User.deleteOne({ _id: user._id });

        res.cookie("myToken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: "None" });
        return res.status(200).json({ message: "Account deleted" });
    } catch (error) {
        console.log("Error deleting account: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
