import React, { useState } from "react";
import axios from "axios";

const UserForm = ({ setShowForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    dob: "",
    email: "",
    telegramId: "",
    currentSem: "", 
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validateDOB = (dob) => /^\d{2}-\d{2}-\d{4}$/.test(dob);

  const validateRegNo = (regNo) => /^7309\d{2}106\d{3}$/.test(regNo);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "currentSem" ? Number(value) : value,
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDOB(formData.dob)) {
      setError("❌ DOB must be in format DD-MM-YYYY");
      return;
    }

    if (!validateRegNo(formData.regNo)) {
      setError("❌ Register Number must follow format: 7309YY106XXX");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://projects2-dv9l.onrender.com";
      await axios.post(`${BASE_URL}/api/users`, formData);
      alert("Registered successfully!");
      setMessage("✅ User registered successfully!");
      setError("");
      setFormData({ name: "", regNo: "", dob: "", email: "", telegramId: "", currentSem: "" });

    } catch (err) {
      const backendMessage = err.response?.data?.error || "Registration failed";
      setError(`❌ ${backendMessage}`);
      setMessage("");
    }
    finally {
      setIsSubmitting(false); // re-enable
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative bg-white shadow-2xl rounded-2xl w-[90%] max-w-md p-8 transition-all duration-300">
        <button
          onClick={() => setShowForm(false)}
          className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          🎓 Student Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["name", "regNo", "dob", "email", "telegramId","currentSem"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                {field === "regNo"
                  ? "Register Number" :field === "currentSem"
                  ? "Expexted semster result "
                  : field === "dob"
                  ? "Date of Birth (DD-MM-YYYY)"
                  : field === "telegramId"
                  ? "Telegram ID (optional)"
                  : field}
              </label>
              <input
                type="text"
                name={field}
                placeholder={
                  field === "dob"
                    ? "10-08-2005"
                    : field === "telegramId"
                    ? "Optional" : field === "currentSem" ? "which semester result you are expecting"
                    : `Enter ${field}`
                }
                value={formData[field]}
                onChange={handleChange}
                required={field !== "telegramId"}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200"
            disabled={isSubmitting}
          >
           {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form> 

        {error && (
          <p className="mt-4 text-center text-red-600 font-medium">{error}</p>
        )}
        {message && (
          <p className="mt-4 text-center text-green-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export default UserForm;
