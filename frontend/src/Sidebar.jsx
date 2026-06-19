export default function Sidebar() {
  return (
    <div className="w-64 bg-[#111827] p-6 border-r border-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold text-cyan-400 mb-12">
        AI HRMS
      </h1>

      <ul className="space-y-6">
        <li className="text-cyan-400 font-semibold">Dashboard</li>
        <li className="text-gray-400 hover:text-white">Employees</li>
        <li className="text-gray-400 hover:text-white">Attendance</li>
        <li className="text-gray-400 hover:text-white">Reports</li>
      </ul>
    </div>
  );
}