import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiMenu,
  FiHome,
  FiUser,
  FiLogOut,
  FiBell,
  FiMoon,
  FiSun
} from "react-icons/fi";

type Leave = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
};

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [role, setRole] = useState("employee");
  const [user, setUser] = useState<any>(null);

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filtered, setFiltered] = useState<Leave[]>([]);

  const [page, setPage] = useState(1);
  const perPage = 5;

  const [filter, setFilter] = useState("all");
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const API = "http://localhost:5000";

  // 🌙 Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    dark ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const parseToken = (token: string) => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    setRole(payload.role);
    setUser(payload);
  };

  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      parseToken(data.token);
      toast.success("Welcome back 👋");
    } else toast.error(data.error);
  };

  const fetchLeaves = async () => {
    const res = await fetch(`${API}/leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLeaves(data);
  };

  useEffect(() => {
    if (token) {
      parseToken(token);
      fetchLeaves();
    }
  }, [token]);

  useEffect(() => {
    let data = [...leaves];
    if (filter !== "all") data = data.filter(l => l.status === filter);
    setFiltered(data);
    setPage(1);
  }, [filter, leaves]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const approve = async (id: number) => {
    await fetch(`${API}/leaves/${id}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Approved");
    fetchLeaves();
  };

  const reject = async (id: number) => {
    await fetch(`${API}/leaves/${id}/reject`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.error("Rejected");
    fetchLeaves();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString();

  // LOGIN
  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Toaster />
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-80">
          <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
          <input
            className="border p-2 w-full mb-3 rounded dark:bg-gray-700"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="border p-2 w-full mb-4 rounded dark:bg-gray-700"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white w-full p-2 rounded"
            onClick={login}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 dark:text-white">
      <Toaster />

      {/* MOBILE MENU */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FiMenu />
      </button>

      {/* SIDEBAR */}
      <div className={`fixed md:static top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 p-6 shadow-xl transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition`}>

        <h2 className="text-xl font-bold mb-6">LeaveSys</h2>

        <ul className="space-y-4">
          <li onClick={() => setView("dashboard")} className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
            <FiHome /> Dashboard
          </li>
          <li onClick={() => setView("profile")} className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
            <FiUser /> Profile
          </li>
        </ul>

        <button
          onClick={() => setDark(!dark)}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 p-2 rounded"
        >
          {dark ? <FiSun /> : <FiMoon />}
          {dark ? "Light" : "Dark"}
        </button>

        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-red-500 text-white p-2 rounded"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* NAVBAR */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 shadow">
          <h1 className="ml-auto text-lg font-semibold">
            {view === "dashboard" ? "Dashboard" : "Profile"}
          </h1>

          <div className="flex items-center gap-4 ml-4">
            <div className="relative">
              <FiBell />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-1 rounded-full text-white">
                3
              </span>
            </div>
            <span className="hidden sm:block text-sm">
              {user?.email}
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-6">

          {view === "profile" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow max-w-md">
              <h2 className="text-xl font-bold mb-4">Profile</h2>
              <p><b>Email:</b> {user?.email}</p>
              <p><b>Role:</b> {role}</p>
            </div>
          )}

          {view === "dashboard" && (
            <>
              <select
                onChange={(e) => setFilter(e.target.value)}
                className="mb-4 p-2 border rounded dark:bg-gray-700"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-right">Start</th>
                      <th className="p-3 text-right">End</th>
                      <th className="p-3 text-right">Status</th>
                      {role === "manager" && (
                        <th className="p-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.map(l => (
                      <tr key={l.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3">{l.name}</td>
                        <td className="p-3 text-right">{formatDate(l.start_date)}</td>
                        <td className="p-3 text-right">{formatDate(l.end_date)}</td>

                        <td className="p-3 text-right">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            l.status === "approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white"
                              : l.status === "rejected"
                              ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-white"
                          }`}>
                            {l.status}
                          </span>
                        </td>

                        {role === "manager" && (
                          <td className="p-3 text-right space-x-2">
                            <button onClick={()=>approve(l.id)} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                            <button onClick={()=>reject(l.id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="mt-4 flex gap-3">
                <button onClick={()=>setPage(p=>Math.max(p-1,1))}>Prev</button>
                <span>Page {page} / {totalPages || 1}</span>
                <button onClick={()=>setPage(p=>Math.min(p+1,totalPages))}>Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;