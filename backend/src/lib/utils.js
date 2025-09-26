import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET, {
    expiresIn: "7d",
  });
};
