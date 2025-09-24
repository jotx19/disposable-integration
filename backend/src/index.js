import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import authRoute from "./routes/auth.route.js"
import roomRoute from "./routes/room.route.js"
import messageRoute from "./routes/message.route.js"
import cors from "cors"
import path from "path"

import { app, server } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";

dotenv.config()
const PORT = process.env.PORT
const __dirname = path.resolve();

connectDB();

app.use(express.json({limit: "50mb"}));
app.use(cookieParser());
app.use(cors({
  origin: ["https://disposable.vercel.app"],
  credentials: true, 
}));


app.use("/api/auth", authRoute);
app.use("/api/room", roomRoute);
app.use("/api/message", messageRoute);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.use(express.static(path.join(__dirname, "../frontend/public")));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
  }
  

server.listen(process.env.PORT, ()=>{
    console.log("Server is running: ",PORT);
})