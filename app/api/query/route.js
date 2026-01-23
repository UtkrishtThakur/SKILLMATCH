import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Query from "@/models/Query";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";
import { sendQueryNotificationEmail } from "@/lib/email";

/* =========================
   SKILL MATCHING HELPERS
========================= */

function normalizeSkill(skill = "") {
    return skill
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function skillToRegex(skill) {
    const normalized = normalizeSkill(skill);

    // Escape regex special chars
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Partial match: minimum 3 chars
    const partial = escaped.slice(0, Math.max(3, escaped.length));

    return new RegExp(partial, "i");
}

/* =========================
   POST: CREATE QUERY
========================= */

export async function POST(req) {
    try {
        await dbConnect();

        const decoded = verifyToken(req);
        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, skills } = await req.json();

        if (!title || !description || !Array.isArray(skills) || skills.length === 0) {
            return NextResponse.json(
                { error: "Title, description, and at least one skill are required." },
                { status: 400 }
            );
        }

        const newQuery = await Query.create({
            creatorId: decoded.id,
            title,
            description,
            skills,
        });

        /* ---- ASYNC EMAIL NOTIFICATIONS ---- */
        (async () => {
            try {
                const creator = await User.findById(decoded.id)
                    .select("name")
                    .lean();

                const creatorName = creator?.name || "A user";

                // Build fuzzy regexes from query skills
                const skillRegexes = skills.map(skill => skillToRegex(skill));

                const matchingUsers = await User.find({
                    _id: { $ne: decoded.id },
                    verified: true,
                    email: { $exists: true, $ne: "" },
                    skills: {
                        $elemMatch: { $in: skillRegexes }
                    }
                }).select("email name").lean();

                await Promise.all(
                    matchingUsers.map(user =>
                        sendQueryNotificationEmail(user.email, {
                            queryId: newQuery._id.toString(),
                            title,
                            description,
                            skills,
                            creatorName,
                        }).catch(err => {
                            console.error(`Failed to send email to ${user.email}:`, err);
                        })
                    )
                );

                console.log(`📧 Sent ${matchingUsers.length} query notification emails`);
            } catch (err) {
                console.error("Query email notification error:", err);
            }
        })();

        return NextResponse.json(
            { message: "Query posted successfully", query: newQuery },
            { status: 201 }
        );
    } catch (err) {
        console.error("Query POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/* =========================
   GET: FETCH QUERIES
========================= */

export async function GET(req) {
    try {
        await dbConnect();

        const decoded = verifyToken(req);
        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view") || "feed";

        let filter = {};

        if (view === "my-queries") {
            filter = { creatorId: decoded.id };
        } 
        else if (view === "solved") {
            filter = { "answers.responderId": decoded.id };
        } 
        else {
            // FEED VIEW (ADVANCED SKILL MATCHING)
            const user = await User.findById(decoded.id)
                .select("skills")
                .lean();

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            if (Array.isArray(user.skills) && user.skills.length > 0) {
                const skillRegexes = user.skills.map(skill => skillToRegex(skill));

                filter = {
                    creatorId: { $ne: decoded.id },
                    status: "open",
                    skills: {
                        $elemMatch: { $in: skillRegexes }
                    }
                };
            } else {
                // Fallback: show all open queries except own
                filter = {
                    creatorId: { $ne: decoded.id },
                    status: "open",
                };
            }
        }

        const queries = await Query.find(filter)
            .populate("creatorId", "name profilePhoto role")
            .populate("answers.responderId", "name profilePhoto role")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ queries }, { status: 200 });
    } catch (err) {
        console.error("Query GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
