import React, { useState } from "react";
import WaveBackground from "./WaveBackground";
import UserForm from "./UserForm";

const HeroSection = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white w-full font-poppins">
      {/* BACKDROP BLUR OVERLAY */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-black text-xl hover:text-red-600"
            >
              ×
            </button>
            <UserForm setShowForm={setShowForm} />
          </div>
        </div>
      )}

      <div className="h-screen ">
        <WaveBackground className="h-screen" />

        {/* Header */}
        <div className="z-10 relative flex  md:flex-row justify-between items-center px-6 py-4 gap-4">
          <div className="text-white text-2xl font-bold tracking-widest">
            ResultNotifier
          </div>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition shadow-[0_0_8px_white] cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex items-center justify-center max-sm:mt-5">
          <div className="z-10 relative flex flex-col items-center justify-center text-center mt-20 px-4 h-auto md:h-[70vh]">
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

      {/* About Section */}
      <section className="relative z-20 mt-12 px-4 md:px-6" id="about">
        <div className="max-w-4xl mx-auto py-12 text-white font-poppins space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white">
            Sooo... What Even Is This? 🤔
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            Hi Excelian, Ever felt like you’re stuck in an endless loop of checking your
            college result page? 😩{" "}
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
            <span className="text-green-400 font-semibold">
              Gmail sollum!
            </span>
            <br />
          </p>
        </div>
      </section>

      {/* Register Button at Bottom */}
      <div className="flex flex-col items-center justify-center text-center mb-12 mt-4 px-4 sm:px-0 relative z-10">
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
