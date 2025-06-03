"use client";
import React, { useState, useEffect } from "react";
import { Home, MapPin } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div
        className={`max-w-2xl mx-auto text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-bold text-indigo-600 mb-4">404</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-blue-500 mx-auto rounded-full"></div>
        </div>
        <div className="mb-10 space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-500" />
            迷路了？
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
            抱歉，你访问的页面似乎不存在。
          </p>
        </div>

        <Link href="/">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button className="group px-8 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
              <Home className="w-5 h-5" />
              回到首页
            </button>
          </div>
        </Link>
      </div>
    </div>
  );
}
