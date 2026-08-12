import { useAuth } from "./AuthContext";

function  Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto mt-10">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        {user ? (
          <p className="mt-4 text-lg text-gray-600">
            Welcome, <span className="font-semibold">{user.username}</span>!
          </p>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;