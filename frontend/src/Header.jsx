export default function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold">HR Dashboard</h1>
        <p className="text-gray-400">Welcome back, Admin</p>
      </div>

      <input
        placeholder="Search employee..."
        className="bg-[#1E293B] px-4 py-3 rounded-xl w-72"
      />
    </div>
  );
}