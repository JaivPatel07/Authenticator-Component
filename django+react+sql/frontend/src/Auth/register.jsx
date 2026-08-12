import { Link } from "react-router-dom";
import { useState } from "react";

function Register() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Clear previous messages
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(event.target);

    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    console.log(data);

    // Temporary validation
    if (!data.username || !data.email || !data.password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (data.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    // Temporary success response
    setSuccessMessage(
      "Registration successful! Please check your email to verify your account."
    );

    event.target.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Create your account to get started
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-700 text-center">
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 text-center">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              name="username"
              placeholder="Enter username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg
                       font-semibold hover:bg-blue-700 transition"
          >
            Register
          </button>

        </form>

        {/* Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}

          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;