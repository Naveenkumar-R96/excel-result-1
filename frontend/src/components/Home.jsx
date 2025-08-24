import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import WaveBackground from "./WaveBackground";
import UserForm from "./UserForm";
import StudentLogin from "./StudentLogin";
import FacultyLogin from "./FacultyLogin";

const HeroSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showFacultyLogin, setShowFacultyLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer

  // Lock background scroll when any overlay is open (modal or drawer)
  const isOverlayOpen =
    showForm || showStudentLogin || showFacultyLogin || menuOpen;
  useEffect(() => {
    document.body.style.overflow = isOverlayOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOverlayOpen]);

  // helpers to open modals from mobile menu and close the drawer
  const openStudent = () => {
    setMenuOpen(false);
    setShowStudentLogin(true);
  };
  const openFaculty = () => {
    setMenuOpen(false);
    setShowFacultyLogin(true);
  };
  const openRegister = () => {
    setMenuOpen(false);
    setShowForm(true);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white w-full font-poppins z-50">
      {/* ---------------- MODALS ---------------- */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-black text-xl hover:text-red-600"
              aria-label="Close"
            >
              ×
            </button>
            <UserForm setShowForm={setShowForm} />
          </div>
        </div>
      )}

      {showStudentLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowStudentLogin(false)}
              className="absolute top-2 right-2 text-black text-xl hover:text-red-600 z-10"
              aria-label="Close"
            >
              ×
            </button>
            <StudentLogin setShowStudentLogin={setShowStudentLogin} />
          </div>
        </div>
      )}

      {showFacultyLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowFacultyLogin(false)}
              className="absolute top-2 right-2 text-black text-xl hover:text-red-600 z-10"
              aria-label="Close"
            >
              ×
            </button>
            <FacultyLogin setShowFacultyLogin={setShowFacultyLogin} />
          </div>
        </div>
      )}

      {/* ---------------- BACKGROUND ---------------- */}
      <div className="h-screen">
        <WaveBackground className="h-screen" />

        {/* ---------------- HEADER (Responsive) ---------------- */}
        <header className="z-10 relative px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="text-white text-2xl font-bold tracking-widest">
              ResultNotifier
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-4 items-center">
              <button
                onClick={() => setShowStudentLogin(true)}
                className="border-2 border-blue-400 px-4 py-2 rounded-md hover:bg-blue-400 hover:text-black transition shadow-[0_0_8px_#60a5fa] cursor-pointer text-sm md:text-base"
              >
                Student Login
              </button>
              <button
                onClick={() => setShowFacultyLogin(true)}
                className="border-2 border-green-400 px-4 py-2 rounded-md hover:bg-green-400 hover:text-black transition shadow-[0_0_8px_#4ade80] cursor-pointer text-sm md:text-base"
              >
                Faculty Login
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="border-2 border-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition shadow-[0_0_8px_white] cursor-pointer text-sm md:text-base"
              >
                Register
              </button>
            </nav>

            {/* Mobile Hamburger (only brand + hamburger visible) */}
            <button
              className="md:hidden p-2 rounded hover:bg-white/10"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={28} />
            </button>
          </div>

          {/* Mobile Drawer + Backdrop */}
          {/* Backdrop */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Drawer Panel */}
          {/* Drawer Panel */}
          <aside
            className={`fixed top-0 right-0 z-50 h-full w-72 sm:w-80 
    bg-black/90 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] 
    md:hidden transform transition-transform duration-300 backdrop-blur-md
    ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
              <span className="text-lg font-semibold tracking-wide">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded hover:bg-white/10 transition"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="p-5 space-y-4">
              <button
                onClick={openStudent}
                className="w-full text-left border-2 border-blue-400 px-4 py-2 rounded-md 
        hover:bg-blue-400 hover:text-black transition 
        shadow-[0_0_8px_#60a5fa]"
              >
                Student Login
              </button>
              <button
                onClick={openFaculty}
                className="w-full text-left border-2 border-green-400 px-4 py-2 rounded-md 
        hover:bg-green-400 hover:text-black transition 
        shadow-[0_0_8px_#4ade80]"
              >
                Faculty Login
              </button>
              <button
                onClick={openRegister}
                className="w-full text-left border-2 border-white px-4 py-2 rounded-md 
        hover:bg-white hover:text-black transition 
        shadow-[0_0_8px_white]"
              >
                Register
              </button>
            </div>
          </aside>
        </header>

        {/* ---------------- HERO ---------------- */}
        <div className="flex items-center justify-center max-sm:mt-5">
          <div className=" relative flex flex-col items-center justify-center text-center mt-20 px-4 h-auto md:h-[70vh]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-wide">
              <span className="block">NO MORE</span>
              <span className="block">REFRESHING RESULT</span>
              <span className="block">PAGES AGAIN</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mt-6 max-w-2xl max-sm:text-xl">
              Tired of asking{" "}
              <span className="text-white text-lg font-bold max-sm:text-2xl">
                “Result vandhucha bro?”
              </span>{" "}
              This tool auto-checks your college result every minute and sends
              it straight to your Gmail. One click setup. Full chill.
            </p>
            <button
              className="mt-8 border-2 border-white px-6 py-3 rounded-md text-lg font-medium hover:bg-white hover:text-black transition shadow-[0_0_10px_white] cursor-pointer"
              onClick={() => {
                const section = document.getElementById("about");
                section?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Know More 👇
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- ABOUT ---------------- */}
      <section className="relative  mt-12 px-4 md:px-6" id="about">
        <div className="max-w-4xl mx-auto py-12 text-white font-poppins space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white">
            Sooo... What Even Is This? 🤔
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            Hi Excelian, Ever felt like you’re stuck in an endless loop of
            checking your college result page? 😩{" "}
            <span className="text-pink-400 font-semibold">
              Refresh panna refresh panna
            </span>
            , still nothing... and when the site finally works —{" "}
            <span className="text-yellow-400 font-semibold">it crashes 🙃</span>
          </p>

          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            That’s exactly why we built this! 🔥 Just register your details
            once, and{" "}
            <span className="text-indigo-400 font-semibold">
              we’ll do the waiting game for you.
            </span>{" "}
            When your result is out,{" "}
            <span className="text-green-400 font-semibold">
              boom 💥 — a neat message straight to your Gmail.
            </span>
          </p>

          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            <span className="text-yellow-300 font-semibold">No stress.</span> No
            more{" "}
            <span className="text-pink-400 font-semibold">
              “enna da site open aagala 😭”
            </span>{" "}
            moments. It's fully auto, built by students like you, for students
            like you.{" "}
            <span className="text-indigo-400 font-semibold">
              Naangaum unga maadhiri dhan bro
            </span>{" "}
            — Excelians with{" "}
            <span className="text-yellow-400 font-semibold">
              too much anxiety and not enough patience 😅
            </span>
          </p>

          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            So just chill 😎, let the bot do the job. When result published,{" "}
            <span className="text-green-400 font-semibold">Gmail sollum!</span>
            <br />
          </p>
        </div>
      </section>

      {/* ---------------- BOTTOM CTA ---------------- */}
      <div className="flex flex-col items-center justify-center text-center mb-12 mt-4 px-4 sm:px-0 relative ">
        <button
          onClick={() => setShowForm(true)}
          className="mt-8 border-2 border-white px-6 py-3 rounded-md text-lg font-medium text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300 shadow-[0_0_10px_white] cursor-pointer"
        >
          Register Now! 🚀
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
