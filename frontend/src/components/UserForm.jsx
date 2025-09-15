// Updated React Component with better validation
import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_URL ;

const UserForm = ({ setShowForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    dob: "",
    email: "",
    telegramId: "",
    year: "",
    section: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateDOB = (dob) => /^\d{2}-\d{2}-\d{4}$/.test(dob);
  const validateRegNo = (regNo) => /^7309\d{2}106\d{3}$/.test(regNo);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validateDOB(formData.dob)) {
      setError("❌ DOB must be in format DD-MM-YYYY");
      return;
    }

    if (!validateRegNo(formData.regNo)) {
      setError("❌ Register Number must follow format: 7309YY106XXX");
      return;
    }

    if (!formData.year || formData.year === "") {
      setError("❌ Please select Year");
      return;
    }

    if (!formData.section || formData.section === "") {
      setError("❌ Please select Section");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const BASE_URL =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : 'https://excel-result-1.onrender.com';

      // Prepare payload with proper type conversion
      const payload = {
        name: formData.name.trim(),
        regNo: formData.regNo.trim(),
        dob: formData.dob.trim(),
        email: formData.email.trim().toLowerCase(),
        telegramId: formData.telegramId.trim() || undefined, // send undefined if empty
        year: parseInt(formData.year, 10), // ensure it's a number
        section: formData.section.trim(),
      };

      console.log("Sending payload:", payload); // Debug log

      const response = await axios.post(`${BASE_URL}/api/users`, payload);
      
      console.log("Response:", response.data); // Debug log

      setMessage("✅ User registered successfully!");
      setError("");
      
      // Reset form
      setFormData({
        name: "",
        regNo: "",
        dob: "",
        email: "",
        telegramId: "",
        year: "",
        section: "",
      });

      // Show success message and close form after delay
      setTimeout(() => {
        setShowForm(false);
      }, 2000);

    } catch (err) {
      console.error("Registration error:", err); // Debug log
      
      const backendMessage = err.response?.data?.error || 
                            err.response?.data?.message || 
                            "Registration failed";
      setError(`❌ ${backendMessage}`);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-y-auto">
      <div className="relativ">
        {/* Close Button */}
       

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2 ">
          🎓 Student Registration
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm md:text-base">
          Fill in your details to complete registration
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["name", "regNo", "dob", "email", "telegramId"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                {field === "regNo"
                  ? "Register Number"
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
                    ? "Optional"
                    : `Enter ${field}`
                }
                value={formData[field]}
                onChange={handleChange}
                required={field !== "telegramId"}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
              />
            </div>
          ))}

          {/* Year Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Year *
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Section Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Section *
            </label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-red-600 font-medium">{error}</p>
        )}
        {message && (
          <p className="mt-4 text-center text-green-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserForm;