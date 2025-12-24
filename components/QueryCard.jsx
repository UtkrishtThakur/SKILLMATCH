"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const QueryCard = ({ query }) => {
    return (
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-emerald-500/30">

            {/* Header: User Info & Time */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Image
                        src={query.creatorId?.profilePhoto || "/default-avatar.png"}
                        alt={query.creatorId?.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover border border-white/10"
                    />
                    <div>
                        <h3 className="text-sm font-bold text-white">{query.creatorId?.name}</h3>
                        <p className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(query.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${query.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {query.status}
                </div>
            </div>

            {/* Content */}
            <Link href={`/query/${query._id}`} className="block">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {query.title}
                </h2>
                <p className="text-slate-300 text-sm line-clamp-3 mb-4">
                    {query.description}
                </p>
            </Link>

            {/* Footer: Skills & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                <div className="flex flex-wrap gap-2">
                    {query.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-white/5 text-slate-300 border border-white/5">
                            {skill}
                        </span>
                    ))}
                    {query.skills.length > 3 && (
                        <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-400">
                            +{query.skills.length - 3}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {query.answers?.length || 0} Answers
                    </span>
                </div>
            </div>
        </div>
    );
};

export default QueryCard;
