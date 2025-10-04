"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage({ params }) {
  const { id } = params;   // ✅ no need for use()
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

  // ✅ Fetch profile
 useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user) {
      router.push("/auth/login");
      return;
    }

    const res = await fetch(`/api/user/${user._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      setUserData(data.user);
    } else {
      alert(data.error || "Unauthorized");
      router.push("/auth/login");
    }
  };

  fetchUser();
}, []);


  // ✅ Update profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/user/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, skills, projects, description }),
    });
    const data = await res.json();

    if (res.ok) {
      setUserData(data.user);
      localStorage.setItem("user", JSON.stringify(data.user)); // keep local in sync
      setEditing(false);
      alert("Profile updated!");
    } else {
      alert(data.error);
    }
  };

  // ✅ Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    const res = await fetch(`/api/user/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const data = await res.json();

    if (res.ok) {
      alert("Password changed successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setChangingPassword(false);
    } else {
      alert(data.error);
    }
  };

  // ✅ Profile photo preview
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setProfilePhoto(reader.result);
      reader.readAsDataURL(file);
    } else {
      alert("Select a valid image file.");
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  if (!userData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
        <p className="animate-pulse text-xl">Loading profile...</p>
      </div>
    );

  // ✅ Helpers
  const renderSkills = () => {
    const skillList = skills.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
    return skillList.length
      ? skillList.map((skill, i) => (
          <span key={i} className="px-3 py-1 rounded-full bg-cyan-500/40 text-white text-sm">
            {skill}
          </span>
        ))
      : <i className="text-white/60">No skills added yet.</i>;
  };

  const renderProjects = () => {
    const projectList = projects.split(/\n/).map((p) => p.trim()).filter(Boolean);
    return projectList.length
      ? projectList.map((proj, i) => (
          <a key={i} href={proj} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-pink-400">
            {proj}
          </a>
        ))
      : <i className="text-white/60">No projects added yet.</i>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex justify-center items-start pt-10 pb-20 px-4">
      <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl text-white flex flex-col gap-10">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            onClick={triggerFileInput}
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-lg cursor-pointer hover:scale-105 transition-transform"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white text-4xl font-bold">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleProfilePhotoChange} className="hidden" />
          </div>
          <div className="flex flex-col sm:flex-1 text-center sm:text-left">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">{userData.name}</h1>
            <p className="text-white/80 mt-1">{userData.email}</p>
          </div>
        </div>

        {/* Profile Info / Edit */}
        {!editing ? (
          <div className="flex flex-col gap-6">
            {/* Description */}
            <div className="bg-white/20 p-4 rounded-xl border border-white/30">
              <h2 className="text-lg font-semibold text-pink-400 mb-2">About Me</h2>
              {description ? (
                <p className="text-white/90 whitespace-pre-line">{description}</p>
              ) : (
                <i className="text-white/60">No description added yet.</i>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white/20 p-4 rounded-xl border border-white/30">
              <h2 className="text-lg font-semibold text-cyan-400 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">{renderSkills()}</div>
            </div>

            {/* Projects */}
            <div className="bg-white/20 p-4 rounded-xl border border-white/30">
              <h2 className="text-lg font-semibold text-purple-400 mb-2">Projects</h2>
              <div className="flex flex-col gap-1">{renderProjects()}</div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl font-semibold shadow-lg hover:brightness-110 transition"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write something about yourself..."
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Add skills (comma or newline separated)"
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
            <textarea
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              placeholder="Add project links (one per line)"
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-3 bg-green-500/80 rounded-3xl hover:bg-green-600 transition font-semibold">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-3 bg-gray-400 rounded-3xl hover:bg-gray-500 transition font-semibold">Cancel</button>
            </div>
          </form>
        )}

        {/* Password Change (unchanged) */}
        <div className="mt-6">
          {!changingPassword ? (
            <button
              onClick={() => setChangingPassword(true)}
              className="w-full py-3 bg-red-500/80 rounded-3xl hover:bg-red-600 transition font-semibold"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="Current Password"
                className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                required
              />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="New Password"
                className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                required
                minLength={6}
              />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm New Password"
                className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                required
                minLength={6}
              />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-3 bg-green-500/80 rounded-3xl hover:bg-green-600 transition font-semibold">Save Password</button>
                <button type="button" onClick={() => setChangingPassword(false)} className="flex-1 py-3 bg-gray-400 rounded-3xl hover:bg-gray-500 transition font-semibold">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
