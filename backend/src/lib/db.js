import mongoose from "mongoose"

export const connectDB = async ()=> {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to database")
    } catch (error) {
        console.log("Unable to connect with Database", error);
    }
}