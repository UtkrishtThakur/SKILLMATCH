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
      // email is locked and not editable, so no need to update it
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
            className="px-3 py-1 rounded-full bg-cyan-500/40 text-white text-sm shadow-md select-text"
            style={{ animation: `popIn 0.3s ease forwards`, animationDelay: `${i * 75}ms` }}
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
            className="text-white underline hover:text-pink-400 select-text break-all"
            style={{ animation: `fadeInUp 0.4s ease forwards`, animationDelay: `${i * 100}ms` }}
          >
            {proj}
          </a>
        ))
      : <i className="text-white/60 select-text">No projects added yet.</i>;
  };

  if (!userData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
        <p className="animate-pulse text-xl select-none">Loading profile...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white flex justify-center p-6">
      <div
        className="w-full max-w-4xl bg-gray-900/90 p-8 rounded-3xl shadow-2xl backdrop-blur-md"
        aria-live="polite"
      >
        {/* Top area: photo, name, email, edit button */}
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
          {/* Profile photo */}
          <div
            className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300 ease-in-out"
            onClick={triggerFileInput}
            title="Click to change profile photo"
            aria-label="Change profile photo"
          >
            <img
              src={profilePhoto || "/default-avatar.png"}
              alt={`${userData.name} profile photo`}
              className={`w-full h-full object-cover rounded-full select-none
                ${photoUploading ? "opacity-50 scale-110 blur-sm" : "opacity-100 scale-100 blur-0"}
                transition-all duration-500 ease-in-out`}
              draggable={false}
            />
            {photoUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                <svg
                  className="animate-spin h-10 w-10 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
          </div>

          {/* Name, email and edit button */}
          <div className="flex-1 flex flex-col justify-center gap-4 select-text">
            <h1 className="text-4xl font-extrabold truncate">{userData.name}</h1>
            <p className="text-gray-300 text-lg truncate">{userData.email}</p>
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
              className="self-start mt-4 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full text-white font-semibold shadow-lg hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-pink-400 transition transform hover:scale-105 active:scale-95"
              type="button"
              aria-label="Edit Profile"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Main content shelf */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Description shelf */}
          <section
            className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg backdrop-blur-md transition-shadow hover:shadow-2xl"
            aria-labelledby="desc-title"
          >
            <h2
              id="desc-title"
              className="text-cyan-400 font-semibold text-xl mb-4 select-none"
            >
              Description
            </h2>
            {!editing ? (
              <p className="whitespace-pre-wrap text-white text-sm min-h-[120px] break-words">
                {description || <i className="text-white/60">No description added.</i>}
              </p>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 p-3 rounded-xl bg-white/20 border border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 text-white placeholder-white/70 resize-none transition"
                spellCheck={false}
                placeholder="Add your description here..."
              />
            )}
          </section>

     {/* Skills shelf */}
<section
  className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg backdrop-blur-md transition-shadow hover:shadow-2xl"
  aria-labelledby="skills-title"
>
  <h2
    id="skills-title"
    className="text-cyan-400 font-semibold text-xl mb-4 select-none"
  >
    Skills
  </h2>
  {!editing ? (
    <div className="flex flex-wrap gap-3 min-h-[40px] max-h-[120px]">
      {skills.trim() ? (
        skills
          .split(/[,\n]+/)
          .map((skill) => skill.trim())
          .filter(Boolean)
          .map((skill, i) => (
            <span
              key={i}
              className="inline-block px-4 py-1 rounded-full bg-cyan-500 text-white text-sm font-medium shadow-sm select-text whitespace-nowrap"
              style={{ animation: `popIn 0.3s ease forwards`, animationDelay: `${i * 75}ms` }}
            >
              {skill}
            </span>
          ))
      ) : (
        <i className="text-white/60 select-text">No skills added yet.</i>
      )}
    </div>
  ) : (
    <textarea
      value={skills}
      onChange={(e) => setSkills(e.target.value)}
      placeholder="Enter skills separated by commas or new lines"
      className="w-full h-28 p-3 rounded-xl bg-white/20 border border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 text-white placeholder-white/70 resize-y transition shadow-inner"
      spellCheck={false}
      rows={4}
    />
  )}
</section>
          {/* Projects shelf */}
          <section
            className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg backdrop-blur-md transition-shadow hover:shadow-2xl"
            aria-labelledby="projects-title"
          >
            <h2
              id="projects-title"
              className="text-pink-400 font-semibold text-xl mb-4 select-none"
            >
              Projects
            </h2>
            {!editing ? (
              <div className="flex flex-col gap-2 min-h-[120px] break-words">
                {renderProjects()}
              </div>
            ) : (
              <textarea
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                placeholder="One project link per line"
                className="w-full h-32 p-3 rounded-xl bg-white/20 border border-transparent focus:border-pink-400 focus:ring-2 focus:ring-pink-400 text-white placeholder-white/70 resize-none transition"
                spellCheck={false}
              />
            )}
          </section>
        </div>

        {/* Edit controls shelf */}
        {editing && (
          <form
            onSubmit={handleUpdate}
            className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex flex-col w-full md:w-auto gap-4 md:flex-row md:items-center md:gap-6">
              {/* Name input */}
              <div className="flex flex-col">
                <label
                  htmlFor="name"
                  className="text-cyan-400 font-semibold mb-1 select-none"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full md:w-64 p-3 rounded-xl bg-white/20 border border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 text-white placeholder-white/70 transition"
                  required
                  spellCheck={false}
                  autoComplete="name"
                />
              </div>

              {/* Email input (locked) */}
              <div className="flex flex-col w-full md:w-72">
                <label
                  htmlFor="email"
                  className="text-cyan-400 font-semibold mb-1 select-none"
                >
                  Email (Locked)
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  className="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 cursor-not-allowed select-text"
                  disabled
                  spellCheck={false}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 w-full md:w-auto">
              <button
                type="submit"
                disabled={loadingUpdate}
                className={`flex-grow md:flex-grow-0 bg-indigo-600 p-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400 transition transform
                  ${loadingUpdate ? "cursor-wait opacity-70" : "hover:bg-indigo-700 hover:scale-105 active:scale-95"}`}
                aria-busy={loadingUpdate}
              >
                {loadingUpdate ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                disabled={loadingUpdate}
                onClick={() => {
                  setEditing(false);
                  setForm({ name: userData.name, email: userData.email });
                  setSkills(userData.skills?.join(", ") || "");
                  setProjects(userData.projects?.join("\n") || "");
                  setDescription(userData.description || "");
                  setShowErrorMessage("");
                }}
                className={`flex-grow md:flex-grow-0 bg-gray-700 p-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-600 transition transform
                  ${loadingUpdate ? "cursor-not-allowed opacity-50" : "hover:bg-gray-600 hover:scale-105 active:scale-95"}`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Messages */}
        {showErrorMessage && (
          <p
            className="mt-4 text-red-400 font-semibold select-text animate-fadeIn"
            role="alert"
          >
            {showErrorMessage}
          </p>
        )}
        {showSuccessMessage && (
          <p
            className="mt-4 text-green-400 font-semibold select-text animate-fadeIn"
            role="alert"
          >
            Profile updated successfully!
          </p>
        )}

        {/* Password Section */}
        <div className="mt-12 select-text">
          <button
            onClick={() => {
              setChangingPassword(!changingPassword);
              setShowPasswordError("");
              setShowPasswordSuccess(false);
              setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            }}
            className="w-full md:w-48 bg-purple-600 hover:bg-purple-700 p-3 rounded-full font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400 transition transform hover:scale-105 active:scale-95"
            type="button"
            aria-expanded={changingPassword}
            aria-controls="password-change-form"
          >
            {changingPassword ? "Cancel Password Change" : "Change Password"}
          </button>

          {changingPassword && (
            <form
              id="password-change-form"
              onSubmit={handlePasswordChange}
              className="space-y-3 mt-6 max-w-md"
              aria-live="polite"
            >
              <input
                type="password"
                placeholder="Old Password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-xl border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400 transition"
                required
                autoComplete="current-password"
                spellCheck={false}
                disabled={loadingPassword}
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-xl border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400 transition"
                required
                minLength={6}
                autoComplete="new-password"
                spellCheck={false}
                disabled={loadingPassword}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full bg-gray-800 p-3 rounded-xl border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400 transition"
                required
                minLength={6}
                autoComplete="new-password"
                spellCheck={false}
                disabled={loadingPassword}
              />
              <button
                type="submit"
                disabled={loadingPassword}
                className={`w-full bg-green-600 p-3 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400 transition transform
                  ${loadingPassword ? "cursor-wait opacity-70" : "hover:bg-green-700 hover:scale-105 active:scale-95"}`}
                aria-busy={loadingPassword}
              >
                {loadingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
              {showPasswordError && (
                <p
                  className="mt-2 text-red-400 font-semibold select-text animate-fadeIn"
                  role="alert"
                >
                  {showPasswordError}
                </p>
              )}
              {showPasswordSuccess && (
                <p
                  className="mt-2 text-green-400 font-semibold select-text animate-fadeIn"
                  role="alert"
                >
                  Password changed successfully!
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0.75);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease forwards;
        }
        .border-gradient-to-tr {
          border-image-slice: 1;
          border-width: 4px;
          border-style: solid;
          border-image-source: linear-gradient(to top right, #22d3ee, #a78bfa, #ec4899);
        }
      `}</style>
    </div>
  );
}