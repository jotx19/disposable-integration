import jwt from "jsonwebtoken";

export const generateToken = (userId, res) =>{

    const token = jwt.sign({userId}, process.env.SECRET,{
        expiresIn:"7d",
    });

    res.cookie("myToken",token,{
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        // secure: process.env.STATUS !== "development"
    });
    return token;
};