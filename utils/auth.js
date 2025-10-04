import jwt from "jsonwebtoken";

export function verifyToken(req) {
  try {
    const authHeader = req.headers.get("authorization"); // "Bearer <token>"
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}
