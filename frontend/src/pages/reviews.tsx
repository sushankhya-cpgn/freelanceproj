import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import { Helmet } from "react-helmet"; // For managing head tags
import Navbar from "@/components/navbar/Navbar";
import Footer from "../components/Footer"; // Assuming Footer component exists
import { motion } from "framer-motion";

const Reviews = () => {
  // =============== Hooks Call =================
  const navigate = useNavigate();
  const [firstRevCon, setFirstRevCon] = useState(true);
  const [secondRevCon, setSecondRevCon] = useState(false);
  const [thirdRevCon, setThirdRevCon] = useState(false);
  const [hiriTal, setHireTal] = useState(true);
  const [fiWork, setFiwork] = useState(false);

  // =============== Functions =================
  const RevListHandleOne = () => {
    setFirstRevCon(true);
    setSecondRevCon(false);
    setThirdRevCon(false);
  };

  const RevListHandleTwo = () => {
    setSecondRevCon(true);
    setFirstRevCon(false);
    setThirdRevCon(false);
  };

  const RevListHandleThree = () => {
    setThirdRevCon(true);
    setFirstRevCon(false);
    setSecondRevCon(false);
  };

  // =============== Reduced Mock Data =================
  const AllReview = [
    {
      id: 1,
      headText: "Stephen and Amiya worked together through Talent Marketplace",
      subHeadFirst: "client",
      desFirst:
        "Stephen is a seasoned trademark attorney who is very clear in his approach. Highly Recommended!",
      nameFirst: "Amiya D.",
      coutryFirst: "India",
      subHeadSesond: "Talent",
      desSecond:
        "Amiya was a great client. Clear deliverable and fast at responding.",
      nameSecond: "Stephen P.",
      countrySecond: "United States",
      category: "Legal",
    },
  ];

  const DevItReview = [
    {
      id: 1,
      headText: "Bojan and Brendan worked together through Talent Marketplace",
      subHeadFirst: "client",
      desFirst:
        "Excellent work by Bojan. He knows his way around ClickFunnels.",
      nameFirst: "Brendan B.",
      coutryFirst: "Singapore",
      subHeadSesond: "Talent",
      desSecond: "Great customer, with accurate and precise directions.",
      nameSecond: "Bojan D.",
      countrySecond: "Slovenia",
      category: "Development & IT",
    },
  ];

  const DesCreReview = [
    {
      id: 1,
      headText: "Sasi bought Freddie's project on Project Catalog",
      subHeadFirst: "client",
      desFirst: "Freddie was awesome and quick to complete the job.",
      nameFirst: "Sasi D.",
      coutryFirst: "Singapore",
      subHeadSesond: "Talent",
      desSecond: "Working with Sasi was a breeze. Clear instructions.",
      nameSecond: "Freddie Ray C.",
      countrySecond: "Philippines",
      category: "Design & Creative",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ============== Head Tag =============== */}
      <Helmet>
        <title>Review on THEWORKLABS Talent</title>
      </Helmet>

      {/* ============= Header ================ */}
      <header className="header-bg">
        <Navbar />
        <div className="container mx-auto mt-5 md:px-3 sm:px-7 px Shepard-3">
          <section className="grid md:grid-cols-2 grid-cols-1 sm:px-5 px-3 py-3 lg:gap-x-14 md:gap-x-10 bg-[#E6FAF6] rounded-xl">
            <div className="lg:mt-2 mt-1 lg:ml-2 ml-1 mb-2">
              <motion.h2
                className="text-[#0C4A6E] font-semibold 2xl:text-6xl lg:text-5xl text-4xl"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                Reviews on THEWORKLABS Talent
              </motion.h2>
              <motion.p
                className="xl:text-xl text-lg text-zinc-700 lg:mt-5 mt-2"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 2 }}
              >
                See how Clients and talent celebrate their wins and stay
                accountable for their work together.
              </motion.p>
              <div className="xl:mt-14 lg:mt-10 mt-5">
                <motion.button
                  className="bg-zinc-700 py-2 px-6 text-white transition hover:bg-zinc-600 font-semibold rounded-full"
                  onClick={() => navigate("/")}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 1 }}
                >
                  Join THEWORKLABS Talent
                </motion.button>
              </div>
            </div>
            <motion.div
              className="md:block hidden justify-self-end"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <img
                src="/images/reviews.png"
                alt="banner-image"
                className="rounded-xl w-full max-w-[790px]"
              />
            </motion.div>
          </section>
        </div>
      </header>

      {/* ================= Main ==================== */}
      <main>
        {/* ================= First Section ================== */}
        <section className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 py-3 md:px-5 sm:px-7 px-3">
          <h2 className="text-zinc-800 xl:text-4xl text-3xl font-semibold">
            Here’s how Talent Staffing works
          </h2>
          <div className="grid md:grid-cols-2 md:gap-x-10 md:gap-y-0 sm:gap-y-3 gap-y-2 sm:px-5 px-4 sm:py-4 py-3 bg-[#E6FAF6] xl:mt-6 mt-5 rounded-xl">
            <div className="lg:space-y-1">
              <div className="flex flex-wrap items-center space-x-1">
                <h4 className="text-zinc-800 font-semibold xl:text-2xl text-xl">
                  Clients rate talent
                </h4>
                <div className="flex item-center space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <FaStar key={i} className="text-green-500 xl:text-2xl text-xl" />
                  ))}
                </div>
                <h4 className="text-zinc-800 font-semibold xl:text-2xl text-xl">
                  4.9/5
                </h4>
              </div>
              <div className="flex flex-wrap items-center space-x-1">
                <h5 className="text-zinc-500 font-semibold text-[17px]">
                  Based on
                </h5>
                <span className="text-zinc-800 font-semibold text-[17px]">
                  2.9 million
                </span>
                <h5 className="text-zinc-500 font-semibold text-[17px]">
                  reviews
                </h5>
              </div>
            </div>
            <div className="lg:space-y-1">
              <div className="flex flex-wrap items-center space-x-1">
                <h4 className="text-zinc-800 font-semibold xl:text-2xl text-xl">
                  Talent rates client
                </h4>
                <div className="flex item-center space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <FaStar key={i} className="text-green-500 xl:text-2xl text-xl" />
                  ))}
                </div>
                <h4 className="text-zinc-800 font-semibold xl:text-2xl text-xl">
                  4.9/5
                </h4>
              </div>
              <div className="flex flex-wrap items-center space-x-1">
                <h5 className="text-zinc-500 font-semibold text-[17px]">
                  Based on
                </h5>
                <span className="text-zinc-800 font-semibold text-[17px]">
                  2.9 million
                </span>
                <h5 className="text-zinc-500 font-semibold text-[17px]">
                  reviews
                </h5>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Second Section ================== */}
        <section className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 py-3 md:px-5 sm:px-7 px-3">
          <div className="flex md:flex-row flex-col justify-between lg:space-x-20 md:space-x-16 px-2">
            <aside className="lg:w-[30%] md:w-[35%]">
              <h2 className="text-zinc-800 xl:text-4xl text-3xl font-semibold">
                What they're Saying
              </h2>
              <ul className="flex md:flex-col md:space-y-3 md:space-x-0 space-x-7 mt-7 md:h-screen md:sticky lg:top-2 md:top-5 md:overflow-x-hidden overflow-x-scroll md:whitespace-normal whitespace-nowrap md:px-0 px-2">
                <li
                  className={`${
                    firstRevCon ? "text-zinc-800" : "text-zinc-500"
                  } font-semibold text-lg cursor-pointer`}
                  onClick={RevListHandleOne}
                >
                  All Specializations
                </li>
                <li
                  className={`${
                    secondRevCon ? "text-zinc-800" : "text-zinc-400"
                  } font-semibold lg:text-lg cursor-pointer`}
                  onClick={RevListHandleTwo}
                >
                  Development & IT
                </li>
                <li
                  className={`${
                    thirdRevCon ? "text-zinc-800" : "text-zinc-400"
                  } font-semibold lg:text-lg cursor-pointer`}
                  onClick={RevListHandleThree}
                >
                  Design & Creative
                </li>
              </ul>
            </aside>

            <div className="xl:w-[60%] lg:w-[63%] md:w-[65%] w-full sm:space-y-5 space-y-4 md:mt-0 mt-7">
              {AllReview.map((curVal) => (
                <div
                  className={`border border-zinc-400 xl:px-5 px-4 xl:py-5 py-4 rounded-xl ${
                    firstRevCon ? "block" : "hidden"
                  }`}
                  key={curVal.id}
                >
                  <h2 className="text-zinc-800 font-semibold xl:text-3xl text-2xl">
                    {curVal.headText}
                  </h2>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadFirst}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desFirst}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameFirst}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.coutryFirst}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadSesond}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desSecond}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameSecond}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.countrySecond}
                      </span>
                    </div>
                  </div>
                  <div className="xl:mt-7 mt-6">
                    <span className="px-5 py-2 bg-[#E6FAF6] rounded-full font-semibold text-sm text-zinc-600">
                      {curVal.category}
                    </span>
                  </div>
                </div>
              ))}
              {DevItReview.map((curVal) => (
                <div
                  className={`border border-zinc-400 xl:px-5 px-4 xl:py-5 py-4 rounded-xl ${
                    secondRevCon ? "block" : "hidden"
                  }`}
                  key={curVal.id}
                >
                  <h2 className="text-zinc-800 font-semibold xl:text-3xl text-2xl">
                    {curVal.headText}
                  </h2>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadFirst}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desFirst}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameFirst}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.coutryFirst}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadSesond}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desSecond}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameSecond}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.countrySecond}
                      </span>
                    </div>
                  </div>
                  <div className="xl:mt-7 mt-6">
                    <span className="px-5 py-2 bg-[#E6FAF6] rounded-full font-semibold text-sm text-zinc-600">
                      {curVal.category}
                    </span>
                  </div>
                </div>
              ))}
              {DesCreReview.map((curVal) => (
                <div
                  className={`border border-zinc-400 xl:px-5 px-4 xl:py-5 py-4 rounded-xl ${
                    thirdRevCon ? "block" : "hidden"
                  }`}
                  key={curVal.id}
                >
                  <h2 className="text-zinc-800 font-semibold xl:text-3xl text-2xl">
                    {curVal.headText}
                  </h2>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadFirst}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desFirst}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameFirst}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.coutryFirst}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col xl:mt-5 mt-4">
                    <span className="text-[17px] text-zinc-500 font-semibold">
                      {curVal.subHeadSesond}
                    </span>
                    <h4 className="lg:text-lg font-semibold text-zinc-800 mt-1">
                      {curVal.desSecond}
                    </h4>
                    <div className="flex items-center space-x-1 xl:mt-4 mt-3">
                      <span className="text-zinc-800 font-semibold lg:text-[17px]">
                        {curVal.nameSecond}
                      </span>
                      <span className="text-zinc-600 font-semibold lg:text-[17px]">
                        {curVal.countrySecond}
                      </span>
                    </div>
                  </div>
                  <div className="xl:mt-7 mt-6">
                    <span className="px-5 py-2 bg-[#E6FAF6] rounded-full font-semibold text-sm text-zinc-600">
                      {curVal.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= Third Section ================== */}
        <section className="bg-[#E6FAF6]">
          <motion.div
            className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 lg:py-20 md:py-10 py-7 md:px-16 sm:px-7 px-3"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-zinc-800 xl:text-4xl text-3xl font-semibold">
              See how businesses get work done on THEWORKLABS Talent
            </h2>
            <div className="flex lg:flex-row flex-col justify-center lg:mt-14 mt-10 2xl:space-x-9 xl:space-x-7 lg:space-x-5 lg:space-y-0 space-y-3">
              <div className="lg:min-w-[50%] xl:min-w-0">
                <img
                  src="/images/see-girls.png"
                  alt="girls-image"
                  className="rounded-xl w-full max-w-[550px]"
                />
              </div>
              <div className="flex md:flex-row flex-col 2xl:space-x-9 xl:space-x-7 md:space-x-5 md:space-y-0 space-y-3">
                <Link to="#">
                  <div className="bg-white py-4 px-4 flex flex-col justify-between rounded-xl items-start md:max-w-sm cursor-pointer">
                    <h3 className="text-zinc-800 lg:text-2xl text-xl font-semibold">
                      Nasdaq Leans on Hybrid Teams
                    </h3>
                    <Link
                      to="#"
                      className="text-blue-700 underline text-lg flex items-center transition hover:text-blue-900 mt-5"
                    >
                      Read Articles
                      <HiArrowRight className="mt-1 ml-1" />
                    </Link>
                  </div>
                </Link>
                <Link to="#">
                  <div className="bg-white py-4 px-4 flex flex-col justify-between rounded-xl items-start md:max-w-sm cursor-pointer">
                    <h3 className="text-zinc-800 lg:text-2xl text-xl font-semibold">
                      How GoDaddy Launched a Program 3x Faster
                    </h3>
                    <Link
                      to="#"
                      className="text-blue-700 underline text-lg flex items-center transition hover:text-blue-900 mt-5"
                    >
                      Read Articles
                      <HiArrowRight className="mt-1 ml-1" />
                    </Link>
                  </div>
                </Link>
              </div>
            </div>
            <button
              className="px-6 py-2 bg-zinc-800 text-white font-semibold rounded-full lg:text-lg mt-7 transition hover:bg-zinc-700"
              onClick={() => navigate("#")}
            >
              Read More Success Stories
            </button>
          </motion.div>
        </section>

        {/* ================= Fourth Section ================== */}
        <section className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 py-3 md:px-5 sm:px-7 px-3">
          <h2 className="text-zinc-800 xl:text-4xl text-3xl font-semibold">
            See what people say about other ways to work
          </h2>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-x-7 lg:gap-y-0 md:gap-y-7 gap-y-5 md:mt-10 mt-7">
            <Link to="#">
              <div className="flex flex-col justify-between bg-[#dcf5f0] transition hover:bg-[#d3eee8] px-4 py-4 rounded-lg min-h-[8rem] cursor-pointer">
                <h3 className="text-zinc-800 lg:text-2xl text-xl font-semibold">
                  Talent Marketplace
                </h3>
                <Link
                  to="#"
                  className="text-blue-700 underline flex items-center transition hover:text-blue-900 mt-5"
                >
                  Read Articles
                  <HiArrowRight className="mt-1 ml-1" />
                </Link>
              </div>
            </Link>
            <Link to="#">
              <div className="flex flex-col justify-between bg-[#dcf5f0] transition hover:bg-[#d3eee8] px-4 py-4 rounded-lg min-h-[8rem] cursor-pointer">
                <h3 className="text-zinc-800 lg:text-2xl text-xl font-semibold">
                  Enterprise Suite
                </h3>
                <Link
                  to="#"
                  className="text-blue-700 underline flex items-center transition hover:text-blue-900 mt-5"
                >
                  Read Articles
                  <HiArrowRight className="mt-1 ml-1" />
                </Link>
              </div>
            </Link>
            <Link to="#">
              <div className="flex flex-col justify-between bg-[#dcf5f0] transition hover:bg-[#d3eee8] px-4 py-4 rounded-lg min-h-[8rem] cursor-pointer">
                <h3 className="text-zinc-800 lg:text-2xl text-xl font-semibold">
                  Project Catalog
                </h3>
                <Link
                  to="#"
                  className="text-blue-700 underline flex items-center transition hover:text-blue-900 mt-5"
                >
                  Read Articles
                  <HiArrowRight className="mt-1 ml-1" />
                </Link>
              </div>
            </Link>
          </div>
        </section>

        {/* ================= Fifth Section ================== */}
        <section className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 py-3 md:px-5 sm:px-7 px-3">
          <h2 className="text-zinc-800 xl:text-4xl text-3xl font-semibold">
            How to get started
          </h2>
          <div className="flex space-x-5 border-b border-gray-300 mt-7">
            <button
              className={`text-lg font-semibold py-2 transition hover:border-green-600 hover:border-b ${
                hiriTal ? "border-b border-zinc-800 text-zinc-800" : "text-zinc-500"
              }`}
              onClick={() => {
                setHireTal(true);
                setFiwork(false);
              }}
            >
              Hiring talent
            </button>
            <button
              className={`text-lg font-semibold py-2 transition hover:border-green-600 hover:border-b ${
                fiWork ? "border-b border-zinc-800 text-zinc-800" : "text-zinc-500"
              }`}
              onClick={() => {
                setFiwork(true);
                setHireTal(false);
              }}
            >
              Finding work
            </button>
          </div>

          {hiriTal && (
            <div>
              <motion.div
                className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 2xl:gap-x-7 gap-x-5 xl:gap-y-0 gap-y-5 mt-4"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/post-job.png"
                      alt="post-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Post a job (it’s free)
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Tell us what you need. Provide as many details as possible.
                    </p>
                  </div>
                </div>
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/talent-come.png"
                      alt="talent-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Talent comes to you
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Get qualified proposals within 24 hours.
                    </p>
                  </div>
                </div>
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/collabration.png"
                      alt="collabration-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Collaborate easily
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Use THEWORKLABS Talent to chat or video call.
                    </p>
                  </div>
                </div>
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/payment-smp.png"
                      alt="payment-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Payment simplified
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Receive invoices and make payments through THEWORKLABS Talent.
                    </p>
                  </div>
                </div>
              </motion.div>
              <button
                className="px-5 py-2 rounded-full bg-zinc-800 text-white font-semibold mt-5 hover:bg-zinc-700"
                onClick={() => navigate("#")}
              >
                Find Talent
              </button>
            </div>
          )}

          {fiWork && (
            <div>
              <motion.div
                className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 2xl:gap-x-7 gap-x-5 xl:gap-y-0 gap-y-5 mt-4"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/post-job.png"
                      alt="post-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Create your profile (it’s free)
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      An eye-catching title and client-focused overview help us match you.
                    </p>
                  </div>
                </div>
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/talent-come.png"
                      alt="talent-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Explore ways to earn
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Work and earn in different ways. Bid for jobs.
                    </p>
                  </div>
                </div>
                <div className="bg-[#E6FAF6] py-4 px-4 rounded-xl">
                  <div className="bg-gradient-to-tr from-teal-200 to-cyan-200 rounded-xl flex justify-center px-4 py-4">
                    <img
                      src="/images/collabration.png"
                      alt="collabration-image"
                      className="w-[150px] h-[130px]"
                    />
                  </div>
                  <div className="mt-2">
                    <h5 className="text-lg font-semibold text-zinc-800">
                      Get paid securely
                    </h5>
                    <p className="text-zinc-500 text-[17px] font-semibold mt-1">
                      Choose how you get paid. Our fixed-price protection releases payments.
                    </p>
                  </div>
                </div>
              </motion.div>
              <button
                className="px-5 py-2 rounded-full bg-zinc-800 text-white font-semibold mt-5 hover:bg-zinc-700"
                onClick={() => navigate("#")}
              >
                Create your Profile
              </button>
            </div>
          )}
        </section>

        {/* ================= Sixth Section ================== */}
        <section className="container mx-auto xl:mt-14 lg:mt-10 md:mt-7 mt-5 py-3 md:px-5 sm:px-7 px-3">
          <div className="lg:grid lg:grid-cols-2 2xl:gap-x-0 xl:gap-x-1 lg:gap-x-3 rounded-xl flex flex-col lg:items-start items-center 2xl:px-10 xl:px-5 md:px-3 sm:px-2 px-3 bg-[#dafaf3]">
            <div>
              <h2 className="xl:text-4xl text-3xl font-semibold text-zinc-800 mt-7 lg:mb-16 sm:mb-7 mb-5">
                Frequently asked questions
              </h2>
              <img
                src="/images/qus2.png"
                alt="question-ask-image"
                className="w-full max-w-[550px]"
              />
            </div>
            <div className="lg:px-7 sm:px-5 px-0 sm:py-5 py-3">
              <div className="border-b border-zinc-300 xl:py-7 sm:py-5 py-3 space-y-2">
                <h4 className="xl:text-3xl sm:text-2xl text-xl font-semibold text-zinc-800">
                  How to get reviews on THEWORKLABS Talent?
                </h4>
                <p className="text-zinc-600 xl:text-xl sm:text-lg text-md">
                  A 14-day feedback period opens at the end of a contract where both the client and talent can leave each other a review.
                </p>
              </div>
              <div className="border-b border-zinc-300 xl:py-7 sm:py-5 py-3 space-y-2">
                <h4 className="xl:text-3xl sm:text-2xl text-xl font-semibold text-zinc-800">
                  How to leave a review on THEWORKLABS Talent?
                </h4>
                <p className="text-zinc-600 xl:text-xl sm:text-lg text-md">
                  During the 14-day feedback period, the client will be asked to leave a review while ending the contract.
                </p>
              </div>
              <div className="border-b border-zinc-300 xl:py-7 sm:py-5 py-3 space-y-2">
                <h4 className="xl:text-3xl sm:text-2xl text-xl font-semibold text-zinc-800">
                  How to contest a review on THEWORKLABS Talent?
                </h4>
                <p className="text-zinc-600 xl:text-xl sm:text-lg text-md">
                  Within 28 days of the contract end, you can post a follow-up comment to a review about you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Eighth Section ================== */}
        <section className="container mx-auto xl:my-14 lg:my-10 md:my-7 my-5 py-3 md:px-5 sm:px-7 px-3">
          <div className="md:grid lg:grid-cols-3 grid-cols-2 xl:gap-x-10 lg:gap-x-7 gap-x-5 flex flex-col md:space-y-0 space-y-4 bg-[#5CA3C5] lg:px-3 sm:px-5 px-3 py-3 rounded-lg">
            <img
              src="/images/rel-rev.jpg"
              alt="showes-image"
              className="rounded-lg w-full"
            />
            <div className="flex flex-col justify-between lg:space-y-10 space-y-5 md:mt-1 mt-2 lg:col-span-2">
              <div>
                <h2 className="lg:text-4xl text-2xl text-gray-100 font-semibold">
                  Build powerful relationships, one review at a time
                </h2>
              </div>
              <div className="lg:flex lg:space-x-7 inline border-t border-gray-100 justify-between py-3 xl:space-y-0 space-y-3">
                <div>
                  <h2 className="text-gray-100 font-semibold xl:text-lg">
                    Join the world’s work marketplace and get work done, your way.
                  </h2>
                </div>
                <div className="min-w-[25%]">
                  <button
                    className="border border-gray-100 text-white px-4 lg:py-2 py-1 rounded-full font-semibold transition hover:text-gray-100 hover:border-gray-300"
                    onClick={() => navigate("#")}
                  >
                    Join THEWORKLABS Talent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== Footer ====================== */}
      <Footer />
    </div>
  );
};

export default Reviews;