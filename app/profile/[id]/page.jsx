'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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

  // Animation & UI state
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState("");
  const [showPasswordError, setShowPasswordError] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => setAnimate(true), []);

  // Fetch profile on mount
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
          alert(data.error || "Unauthorized");
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        alert("Something went wrong.");
        router.push("/auth/login");
      }
    };

    fetchUser();
  }, [id, router]);

  // Update profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    setShowSuccessMessage(false);
    setShowErrorMessage("");
    const token = localStorage.getItem("token");
    if (!token) {
      setShowErrorMessage("Login required!");
      setLoadingUpdate(false);
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setEditing(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 4000);
      } else {
        setShowErrorMessage(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setShowErrorMessage("Something went wrong while updating profile.");
    }
    setLoadingUpdate(false);
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setShowPasswordSuccess(false);
    setShowPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setShowPasswordError("Passwords do not match!");
      setLoadingPassword(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setShowPasswordError("Login required!");
      setLoadingPassword(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/${id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (res.ok) {
        setShowPasswordSuccess(true);
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setChangingPassword(false);
        setTimeout(() => setShowPasswordSuccess(false), 4000);
      } else {
        setShowPasswordError(data.error || "Password change failed");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setShowPasswordError("Something went wrong while changing password.");
    }
    setLoadingPassword(false);
  };

  // Profile photo preview with animation
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
    } else {
      alert("Select a valid image file.");
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // Helpers for Skills & Projects display
  const renderSkills = () => {
    const skillList = skills.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
    return skillList.length
      ? skillList.map((skill, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full bg-white text-[#1d365e] text-sm font-medium shadow-sm select-text transform transition-all duration-200 hover:scale-105"
            style={{ marginRight: 6, marginBottom: 6 }}
          >
            {skill}
          </span>
        ))
      : <i className="text-white/60 select-text">No skills added yet.</i>;
  };

  const renderProjects = () => {
    const projectList = projects.split(/\n/).map((p) => p.trim()).filter(Boolean);
    return projectList.length
      ? projectList.map((proj, i) => (
          <a
            key={i}
            href={proj}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-white/80 select-text break-all"
            style={{ display: "block", marginBottom: 6 }}
          >
            {proj}
          </a>
        ))
      : <i className="text-white/60 select-text">No projects added yet.</i>;
  };

  // UI-only parsing of description into From / About (no storage changes)
  const parseDescription = (desc) => {
    if (!desc || !desc.trim()) return { from: "", about: "" };
    if (desc.includes("\n\n")) {
      const [first, ...rest] = desc.split("\n\n");
      return { from: first.trim(), about: rest.join("\n\n").trim() };
    }
    if (desc.includes("---")) {
      const [first, ...rest] = desc.split("---");
      return { from: first.trim(), about: rest.join("---").trim() };
    }
    const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1) {
      const single = lines[0];
      if (single.length < 40 && (/[,]/.test(single) || /\bfrom\b/i.test(single) || /^[A-Za-z\s]+$/.test(single))) {
        return { from: single, about: "" };
      }
      return { from: "", about: single };
    }
    return { from: lines[0], about: lines.slice(1).join(" ") };
  };

  if (!userData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="animate-pulse text-[#1d365e] text-lg select-none">Loading profile...</p>
      </div>
    );

  const { from: locationPart, about: aboutPart } = parseDescription(description);

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 sm:px-6 lg:px-8 py-50 select-none relative overflow-hidden">
      {/* Decorative subtle blobs like login page (hidden on very small screens) */}
      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -top-36 -left-36 w-[420px] h-[420px] opacity-8 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="pBlob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#pBlob1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -bottom-36 -right-36 w-[420px] h-[420px] opacity-6 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="pBlob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#pBlob2)" />
      </svg>

      {/* Centered card matching Login UI style: dark card on white page, spaced from navbar */}
      <div
        className={`relative z-20 w-full max-w-4xl bg-[#1d365e] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-white/20 transition-all duration-700 ease-out ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ marginTop: "3.5rem" }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white object-cover shadow-md cursor-pointer transform transition-transform duration-200 hover:scale-105"
              onClick={triggerFileInput}
              title="Change profile photo"
            >
              <img
                src={profilePhoto || "/default-avatar.png"}
                alt={`${userData.name} profile photo`}
                className={`w-full h-full object-cover rounded-full select-none transition-all duration-300 ${photoUploading ? "opacity-60 scale-105" : "opacity-100 scale-100"}`}
                draggable={false}
              />
              {photoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleProfilePhotoChange} className="hidden" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold truncate">{userData.name}</h1>
              <p className="text-white/75 text-sm sm:text-base mt-1 truncate">{userData.email}</p>
              <p className="text-white/60 text-sm mt-2">{userData.role || "Learner"} • {userData.location || "Location not set"}</p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-3">
            <button
              onClick={() => {
                setEditing(true);
                setForm({ name: userData.name, email: userData.email });
                setSkills(userData.skills?.join(", ") || "");
                setProjects(userData.projects?.join("\n") || "");
                setDescription(userData.description || "");
                setShowErrorMessage("");
                setShowSuccessMessage(false);
              }}
              className="px-4 py-2 rounded-full bg-white text-[#1d365e] font-semibold shadow hover:scale-105 transition-transform"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                setChangingPassword(!changingPassword);
                setShowPasswordError("");
                setShowPasswordSuccess(false);
                setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
              }}
              className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition"
            >
              {changingPassword ? "Cancel" : "Change Password"}
            </button>
          </div>
        </div>

        {/* Grid like login-style stacked sections for smaller devices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Description block */}
          <div className="md:col-span-1 bg-white/6 rounded-xl p-4">
            <h2 className="text-white/90 font-semibold mb-2">Description</h2>
            <div className="text-sm text-white/70 mb-3">
              <div className="mb-2">
                <div className="text-white/80 text-xs">Where I'm from</div>
                {locationPart ? <div>{locationPart}</div> : <div className="text-white/40 italic">Not specified</div>}
              </div>
              <div>
                <div className="text-white/80 text-xs">Who I am</div>
                {aboutPart ? <div className="whitespace-pre-wrap">{aboutPart}</div> : (description ? <div className="whitespace-pre-wrap">{description}</div> : <div className="text-white/40 italic">No bio yet</div>)}
              </div>
            </div>

            {editing && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-2 p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white placeholder-white/60 resize-none"
                rows={4}
                placeholder="City, Country (blank line) Short bio..."
              />
            )}
          </div>

          {/* Skills block */}
          <div className="md:col-span-1 bg-white/6 rounded-xl p-4">
            <h2 className="text-white/90 font-semibold mb-2">Major Skills</h2>
            <div className="mb-2">
              {!editing ? <div className="flex flex-wrap">{renderSkills()}</div> : (
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="comma separated or new lines"
                  className="w-full p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white placeholder-white/60 resize-y"
                  rows={5}
                />
              )}
            </div>
          </div>

          {/* Projects block */}
          <div className="md:col-span-1 bg-white/6 rounded-xl p-4">
            <h2 className="text-white/90 font-semibold mb-2">Projects</h2>
            <div className="mb-2">
              {!editing ? <div className="flex flex-col">{renderProjects()}</div> : (
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="One link per line"
                  className="w-full p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white placeholder-white/60 resize-none"
                  rows={5}
                />
              )}
            </div>
          </div>
        </div>

        {/* Edit form area (shown when editing) */}
        {editing && (
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-white/80 text-sm">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-2 p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white placeholder-white/60"
                  required
                />
              </div>
              <div>
                <label className="text-white/80 text-sm">Email (Locked)</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full mt-2 p-3 rounded-lg bg-gray-800 border border-gray-700 cursor-not-allowed text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm({ name: userData.name, email: userData.email });
                  setSkills(userData.skills?.join(", ") || "");
                  setProjects(userData.projects?.join("\n") || "");
                  setDescription(userData.description || "");
                  setShowErrorMessage("");
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loadingUpdate}
                className="px-4 py-2 rounded-lg bg-white text-[#1d365e] font-semibold"
              >
                {loadingUpdate ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}

        {/* Password change area */}
        {changingPassword && (
          <form onSubmit={handlePasswordChange} className="mt-6 space-y-3 max-w-md">
            <input
              type="password"
              placeholder="Old password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="w-full p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white"
              required
              disabled={loadingPassword}
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white"
              required
              minLength={6}
              disabled={loadingPassword}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full p-3 rounded-lg bg-white/6 border border-transparent focus:border-white/20 focus:ring-2 focus:ring-white/10 text-white"
              required
              minLength={6}
              disabled={loadingPassword}
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setChangingPassword(false)} className="px-4 py-2 rounded-lg bg-gray-800 text-white">
                Cancel
              </button>
              <button type="submit" disabled={loadingPassword} className="px-4 py-2 rounded-lg bg-white text-[#1d365e] font-semibold">
                {loadingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* Messages */}
        {showErrorMessage && <p className="mt-4 text-red-400">{showErrorMessage}</p>}
        {showSuccessMessage && <p className="mt-4 text-green-400">Profile updated successfully!</p>}
        {showPasswordError && <p className="mt-4 text-red-400">{showPasswordError}</p>}
        {showPasswordSuccess && <p className="mt-4 text-green-400">Password changed successfully!</p>}
      </div>

      <style jsx>{`
        .blur-3xl {
          filter: blur(28px);
        }
        @media (max-width: 640px) {
          .max-w-4xl { padding: 12px; }
        }
      `}</style>
    </div>
  );
}