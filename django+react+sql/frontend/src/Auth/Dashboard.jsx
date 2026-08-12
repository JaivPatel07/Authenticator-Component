import { useState } from "react";
import { useAuth } from "./AuthContext";
import { updateUserProfile, deleteUserAccount } from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user, updateUserLocal, logout } = useAuth();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({ type: "", text: "" });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameMessage({ type: "", text: "" });
    try {
      const updatedUser = await updateUserProfile({ username: newUsername });
      updateUserLocal(updatedUser);
      setUsernameMessage({ type: "success", text: "Username updated successfully!" });
      setNewUsername("");
    } catch (error) {
      setUsernameMessage({ type: "error", text: error.message });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    try {
      await updateUserProfile({ old_password: oldPassword, password: newPassword });
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteUserAccount();
        logout();
        navigate("/login");
      } catch (error) {
        alert(error.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="container mx-auto mt-10 px-4 pb-10">
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        {user ? (
          <p className="mt-4 text-lg text-gray-600">
            Welcome back, <span className="font-semibold text-blue-600">{user.username}</span>!
          </p>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Change Username Settings */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Username</h2>
            
            {usernameMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${usernameMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {usernameMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new username"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Update Username
              </button>
            </form>
          </div>

          {/* Change Password Settings */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
            
            {passwordMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${passwordMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password (min 8 chars)"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-white p-8 rounded-lg shadow-md md:col-span-2 border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-gray-600 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;