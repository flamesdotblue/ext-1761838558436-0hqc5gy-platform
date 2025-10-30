import React from "react";
import Header from "./components/Header";
import AlphabetPlayer from "./components/AlphabetPlayer";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 text-slate-800">
      <Header />
      <main className="max-w-5xl mx-auto px-4">
        <AlphabetPlayer />
      </main>
      <Footer />
    </div>
  );
}
