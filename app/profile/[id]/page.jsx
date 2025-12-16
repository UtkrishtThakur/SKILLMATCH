"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage({ params }) {
  const { id } = params;
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef(null);

  // UI States
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => setAnimate(true), []);

  // Fetch
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      try {
        const res = await fetch(`/api/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUserData(data.user);
          setForm({ name: data.user.name, email: data.user.email });
          setSkills(data.user.skills?.join(", ") || "");
          setProjects(data.user.projects?.join("\n") || "");
          setDescription(data.user.description || "");
          setProfilePhoto(data.user.profilePhoto || null);
        } else {
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    fetchUser();
  }, [id, router]);

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const updateData = {
      name: form.name || userData.name,
      skills: skills.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean),
      projects: projects.split(/\n/).map((p) => p.trim()).filter(Boolean),
      description,
      profilePhoto,
    };

    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setEditing(false);
        alert("Profile updated!");
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingUpdate(false);
  };

  // Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert("Passwords mismatch");
    setLoadingPassword(true);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/user/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password changed!");
        setChangingPassword(false);
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.error || "Failed");
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingPassword(false);
  };

  // Photo
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setPhotoUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePhoto(reader.result);
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!userData) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full font-semibold"></div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-emerald-500/30">

      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      <div className={`max-w-5xl mx-auto relative z-10 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>

        {/* Header Card */}
        <div className="relative mb-8 rounded-3xl bg-[#111] border border-white/10 p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/30 to-emerald-900/30"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0a0a0a] overflow-hidden shadow-2xl">
                <Image
                  src={profilePhoto || userData.profilePhoto || "/default-avatar.png"}
                  alt="Profile"
                  width={160}
                  height={160}
                  className={`w-full h-full object-cover transition-all ${photoUploading ? 'opacity-50' : ''}`}
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-white text-black rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-black mb-2">{userData.name}</h1>
              <p className="text-slate-400 text-lg mb-4">{userData.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {editing ? "Cancel Edit" : "Edit Profile"}
                </button>
                <button
                  onClick={() => setChangingPassword(!changingPassword)}
                  className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                >
                  Security
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.push("/");
                  }}
                  className="px-6 py-2 bg-red-500/10 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Bio */}
          <div className="md:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> About Me
            </h3>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {description || "No bio added yet."}
              </div>
            )}
          </div>

          {/* Skills & Projects */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400"></span> Skills
              </h3>
              {editing ? (
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-violet-500/50"
                  placeholder="React, Node, css..."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(skills.split(/[,\n]/).filter(Boolean).length > 0) ? (
                    skills.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">
                        {skill}
                      </span>
                    ))
                  ) : <span className="text-slate-500 italic">No skills added.</span>}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span> Projects
              </h3>
              {editing ? (
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-fuchsia-500/50"
                  placeholder="https://github.com/..."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {(projects.split('\n').filter(Boolean).length > 0) ? (
                    projects.split('\n').map(p => p.trim()).filter(Boolean).map((proj, i) => (
                      <a key={i} href={proj} target="_blank" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm truncate underline">
                        {proj}
                      </a>
                    ))
                  ) : <span className="text-slate-500 italic">No projects listed.</span>}
                </div>
              )}
            </div>
          </div>

          {/* Save Button (Sticky) */}
          {editing && (
            <div className="col-span-full flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={loadingUpdate}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                {loadingUpdate ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Password Change Form */}
          {changingPassword && (
            <div className="col-span-full bg-[#111] border border-red-500/20 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold mb-6 text-red-400">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password" placeholder="Old Password"
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50"
                />
                <input
                  type="password" placeholder="New Password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50"
                />
                <input
                  type="password" placeholder="Confirm Password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50"
                />
                <div className="md:col-span-3 flex justify-end gap-3">
                  <button type="button" onClick={() => setChangingPassword(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">Update Password</button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}