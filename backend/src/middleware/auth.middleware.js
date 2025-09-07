import jwt from "jsonwebtoken"
import User from "../models/user.model.js";

export const protectRoute = async(req, res, next)=>{
    try {
        const token = req.cookies.myToken;
        if(!token){
            return res.status(401).json({message:"Unauthorized Access: No Token Found"});
        }

        const decoder = jwt.verify(token, process.env.SECRET);
        if(!decoder){
            return res.status(401).json({message: "Unauthorized Invalid token"});
        }

        const user = await User.findById(decoder.userId).select("-password");
        if(!user){
            return res.status(401).json({message: "User not found"});
        }

        req.user = user
        next()
    } catch (error) {
        console.log("Error in ProtectRoute middleware: ", error);
        return res.status(500).json({message: "Internal Server error"});
    }
}