import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

/* =========================
   AUTH HELPER
========================= */
function getDecodedUser(req) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

/* =========================
   SKILL MATCH HELPERS
========================= */
function normalizeSkill(skill = "") {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.+# ]/g, "")
    .replace(/\s+/g, " ");
}

function tokenize(skill) {
  return normalizeSkill(skill)
    .split(" ")
    .filter(token => token.length >= 3);
}

function hasHalfMatch(requiredSkills = [], userSkills = []) {
  const requiredTokens = requiredSkills.flatMap(tokenize);
  const userTokens = userSkills.flatMap(tokenize);

  return requiredTokens.some(req =>
    userTokens.some(user =>
      user.startsWith(req) || req.startsWith(user)
    )
  );
}

/* =========================
   GET /api/user/:id
========================= */
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const decoded = getDecodedUser(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (decoded.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(id)
      .select("-password -__v")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("GET user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /api/user/:id
========================= */
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const decoded = getDecodedUser(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (decoded.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    /* ---- WHITELIST UPDATES ---- */
    const allowedUpdates = {
      name: body.name,
      email: body.email,
      skills: Array.isArray(body.skills)
        ? body.skills.map(normalizeSkill)
        : undefined,
      projects: body.projects,
      description: body.description,
      profilePhoto: body.profilePhoto,
    };

    Object.keys(allowedUpdates).forEach(
      key => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    )
      .select("-password -__v")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (err) {
    console.error("PUT user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   SKILL ALERT MATCH EXPORT
   (USE THIS IN QUERY ROUTE)
========================= */
export async function findUsersByHalfSkillMatch({
  requiredSkills = [],
  excludeUserId,
}) {
  await dbConnect();

  const users = await User.find({
    _id: { $ne: excludeUserId },
    verified: true,
    email: { $exists: true, $ne: "" },
  })
    .select("email name skills")
    .lean();

  return users.filter(user =>
    hasHalfMatch(requiredSkills, user.skills || [])
  );
}
