import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized - No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    console.log("✅ Decoded token:", decoded);

    const user = await Admin.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ User not found:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
