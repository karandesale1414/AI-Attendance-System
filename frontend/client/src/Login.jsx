import { useState } from "react";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {

        localStorage.setItem(
          "token",
          data.token
        );

        alert("✅ Login Success");

        window.location.reload();

      } else {

        alert("❌ Invalid Login");
      }

    } catch (err) {

      console.log(err);

      alert("❌ Server Error");
    }
  };

  return (

    <div className="min-h-screen bg-black flex justify-center items-center">

      <div className="bg-[#111827] p-10 rounded-2xl w-[400px]">

        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          AI HRMS Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full mb-4 p-3 rounded-xl bg-[#1E293B] text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full mb-4 p-3 rounded-xl bg-[#1E293B] text-white"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-cyan-500 hover:bg-cyan-600 p-3 rounded-xl text-white font-bold"
        >
          Login
        </button>

      </div>

    </div>
  );
}

export default Login;