import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-8">
        <Header />

        <h2 className="text-xl text-gray-300">
          Now we will connect Cards + Chart + Table next 🔥
        </h2>
      </div>
    </div>
  );
}