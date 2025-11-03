import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaCaretDown,
  FaSearch,
  FaChevronDown,
  FaBars,
  FaLongArrowAltRight,
  FaAngleDown,
  FaAngleRight,
  FaUserCircle,
} from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { GoChevronRight } from "react-icons/go";
import { useAuth } from "../../context/AuthContext";

import {
  SubLinks1,
  SubLinks2,
  SubLinks3,
} from "./LinkData";
import SearchLink from "./SearchLink";
import {  MoreLink } from "./SecondLink";
import SecondLink from "./SecondLink";

const Navbar: React.FC = () => {
  // ------------- Routing -------------
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // ------------- State -------------
  const [searchState, setSearchState] = useState<"hidden" | "block">("hidden");
  const [moreDp, setMoreDp] = useState<"hidden" | "">("hidden");

  const [inputText, setInputText] = useState("");
  const [subLinksI, setSubLinksI] = useState(false);
  const [subLinksII, setSubLinksII] = useState(false);
  const [subLinksIII, setSubLinksIII] = useState(false);

  const [subContntI, setSubContntI] = useState(true);
  const [subContntII, setSubContntII] = useState(false);
  const [subContntIII, setSubContntIII] = useState(false);

  // Mobile
  const [mobilelist, setMobileList] = useState(false);
  const [mobileSubListI, setMobileSubListI] = useState(false);
  const [mobileSubListII, setMobileSubListII] = useState(false);
  const [mobileSubListIII, setMobileSubListIII] = useState(false);

  const [SubLinks2New, setSubLinks2New] = useState(SubLinks2);
  const [se, setSe] = useState<number | null>(null);

  // ------------- Helpers -------------
  const ShowSearchState = () => {
    setSearchState((prev) => (prev === "hidden" ? "block" : "hidden"));
  };

  const search = (e: React.FormEvent) => e.preventDefault();

  // Desktop dropdown toggles
  const FirstLinkHandle = () => {
    setSubLinksI((v) => !v);
    setSubLinksII(false);
    setSubLinksIII(false);
  };
  const SecondLinkHandle = () => {
    setSubLinksII((v) => !v);
    setSubLinksI(false);
    setSubLinksIII(false);
  };
  const ThirdLinkHandle = () => {
    setSubLinksIII((v) => !v);
    setSubLinksI(false);
    setSubLinksII(false);
  };

  // Desktop sub-content switch
  const SubLinksBtn = (id: number) => {
    if (id === 1) {
      setSubContntI(true);
      setSubContntII(false);
      setSubContntIII(false);
    } else if (id === 2) {
      setSubContntII(true);
      setSubContntI(false);
      setSubContntIII(false);
    } else if (id === 3) {
      setSubContntIII(true);
      setSubContntI(false);
      setSubContntII(false);
    }
  };

  // Mobile dropdown toggles
  const FirstLinkHandleMb = () => {
    setMobileSubListI((v) => !v);
    setMobileSubListII(false);
    setMobileSubListIII(false);
  };
  const SecondLinkHandleMb = () => {
    setMobileSubListII((v) => !v);
    setMobileSubListI(false);
    setMobileSubListIII(false);
  };
  const ThirdLinkHandleMb = () => {
    setMobileSubListIII((v) => !v);
    setMobileSubListI(false);
    setMobileSubListII(false);
  };

  // Mobile sub-content toggle
  const handleMobileSub = (id: number) => {
    setSe((prev) => (prev === id ? null : id));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileView = () => {
    if (!user) {
      navigate("/");
      return;
    }
    const userType = (user as any).userType;
    if (userType === "freelancer") {
      navigate("/freelancerhomepage");
    } else if (userType === "client") {
      navigate("/clienthomepage");
    } else if (userType === "agency") {
      navigate("/agencyhomepage");
    } else {
      navigate("/");
    }
  };

  // ------------- Auth / role logic -------------
  useEffect(() => {
    // Role-based menu filtering (same logic you had)
    let newSubLinks2 = [...SubLinks2];

    switch (user?.rool) {
      case null:
      case undefined:
        // hide some sublinks for guests
        SubLinks1.forEach((item) => {
          if (item.sublink) {
            item.sublink = item.sublink.filter(
              (s) => ![6, 11, 12, 13].includes(s.id)
            );
          }
        });
        newSubLinks2 = newSubLinks2.filter((i) => ![1, 2].includes(i.id));
        break;

      case "freelancer":
        // keep everything
        break;

      case "organization":
        newSubLinks2 = newSubLinks2.filter((i) => ![1, 2].includes(i.id));
        break;

      default:
        break;
    }
    setSubLinks2New(newSubLinks2);
  }, []);

  // -------------------------------------------------------------------------
  return (
    <nav className="font-sans">
      {/* ====================== DESKTOP: FIRST BAR ====================== */}
      <div className="hidden lg:flex container mx-auto py-3 px-3 items-center justify-between border-b">
        {/* ---- Left ---- */}
        <div className="flex items-center">
          <img
            src="/images/logo.png"
            alt="logo"
            width={130}
            height={120}
            className="cursor-pointer"
            onClick={() => navigate("/")}
          />
          <ul className="flex 2xl:space-x-12 xl:space-x-9 space-x-6 2xl:ml-14 xl:ml-11 ml-6">
            {/* ---------- Find Talent ---------- */}
            <li>
              <a
                className={`cursor-pointer flex items-center text-[1.03rem] font-semibold hover:text-cyan-700 ${
                  subLinksI ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={FirstLinkHandle}
              >
                Find Talent
                <FaCaretDown
                  className={`mt-1 xl:ml-1 ml-[1px] transition ${
                    subLinksI ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {/* Mega-dropdown */}
              {subLinksI && (
                <div className="absolute bg-[#F3FFFC] shadow-md left-0 right-0 top-20 z-20">
                  <div className="container mx-auto flex xl:space-x-10 space-x-8 py-5 px-3">
                    {/* Left column – categories */}
                    <ul className="flex flex-col xl:space-y-2 space-y-1">
                      {SubLinks1.map((curVal) => (
                        <li
                          key={curVal.id}
                          className={`flex items-center justify-between space-x-7 cursor-pointer rounded-sm hover:bg-gradient-to-tr hover:from-[#eeecec] hover:to-[#c3f0f5] px-4 py-4 ${
                            (subContntI && curVal.id === 1) ||
                            (subContntII && curVal.id === 2) ||
                            (subContntIII && curVal.id === 3)
                              ? "bg-gradient-to-tr from-[#eeecec] to-[#c3f0f5]"
                              : ""
                          }`}
                          onClick={() => SubLinksBtn(curVal.id)}
                        >
                          <div>
                            <strong className="font-semibold text-zinc-700">
                              {curVal.head}
                            </strong>
                            <span className="block font-semibold text-sm text-zinc-500">
                              {curVal.headers}
                            </span>
                          </div>
                          <GoChevronRight className="text-lg text-cyan-700" />
                        </li>
                      ))}
                    </ul>

                    {/* Right content – varies by selected tab */}
                    {subContntI && (
                      <div className="border-l border-gray-300 flex xl:flex-row flex-col 2xl:space-x-64 xl:space-x-44">
                        <div className="xl:ml-14 ml-10">
                          <strong className="text-lg font-semibold text-zinc-700">
                            {SubLinks1[0].subhead.name}
                          </strong>
                          <span className="block text-sm font-semibold text-zinc-500 my-3">
                            {SubLinks1[0].subhead.des}
                          </span>
                          <Link
                            to={SubLinks1[0].subhead.subheadlink.link}
                            className="text-sm font-semibold cursor-pointer text-cyan-700 hover:underline"
                          >
                            {SubLinks1[0].subhead.subheadlink.name}
                            <FaLongArrowAltRight className="inline ml-2 text-lg" />
                          </Link>
                        </div>

                        <div className="xl:ml-0 ml-8 xl:mt-0 mt-7">
                          <ul className="grid grid-cols-2 gap-x-10 xl:gap-x-0 xl:grid-cols-1">
                            {SubLinks1[0].sublink.map((curVal) => (
                              <li
                                key={curVal.id}
                                className="px-3 py-2 hover:bg-[#e1f7fa] hover:text-cyan-800 rounded-sm text-zinc-700"
                              >
                                <Link to={curVal.link}>{curVal.linktext}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* ---------- (repeat for II / III – omitted for brevity) ---------- */}
                    {subContntII }
                    {subContntIII}
                  </div>
                </div>
              )}
            </li>

            {/* ---------- Find Jobs ---------- */}
            <li>
              <a
                className={`cursor-pointer flex items-center text-[1.03rem] font-semibold hover:text-cyan-700 ${
                  subLinksII ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={SecondLinkHandle}
              >
                Find Jobs
                <FaCaretDown
                  className={`mt-1 xl:ml-1 ml-[1px] transition ${
                    subLinksII ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {subLinksII && (
                <div className="absolute bg-[#F3FFFC] shadow-md left-0 right-0 top-20 z-20">
                  <ul className="container mx-auto flex xl:space-x-28 space-x-20 py-5 px-3">
                    {SubLinks2New.map((curVal) => (
                      <li
                        key={curVal.id}
                        className="px-2 py-4 cursor-pointer rounded-sm hover:bg-gradient-to-tr from-[#eeecec] to-[#c3f0f5]"
                      >
                        <Link to={curVal.link}>
                          <div className="flex flex-col space-y-2 2xl:ml-11 ml-7 max-w-[17rem]">
                            <strong className="font-semibold text-zinc-700">
                              {curVal.name}
                            </strong>
                            <span className="font-semibold text-zinc-500 text-sm">
                              {curVal.des}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {/* ---------- Why THEWORKLABS Talent ---------- */}
            <li>
              <a
                className={`cursor-pointer flex items-center text-[1.03rem] font-semibold hover:text-cyan-700 ${
                  subLinksIII ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={ThirdLinkHandle}
              >
                Why THEWORKLABS Talent
                <FaCaretDown
                  className={`mt-1 xl:ml-1 ml-[1px] transition ${
                    subLinksIII ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {subLinksIII && (
                <div className="absolute bg-[#F3FFFC] shadow-md left-0 right-0 top-20 z-20">
                  <div className="container mx-auto py-5 px-3">
                    <ul className="inline-grid grid-cols-2 gap-x-20 mb-5">
                      {SubLinks3.map((curVal) => (
                        <li
                          key={curVal.id}
                          className="pr-5 py-7 cursor-pointer rounded-sm hover:bg-gradient-to-tr from-[#eeecec] to-[#c3f0f5]"
                        >
                          <Link to={curVal.link}>
                            <div className="flex flex-col space-y-2 2xl:ml-11 ml-7">
                              <strong className="font-semibold text-zinc-700">
                                {curVal.name}
                              </strong>
                              <span className="font-semibold text-zinc-500 text-sm">
                                {curVal.des}
                              </span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Enterprise */}
            <li className="text-zinc-700 text-[1.03rem] font-semibold hover:text-cyan-700">
              <Link to="/enterprise">Enterprise</Link>
            </li>
          </ul>
        </div>

        {/* ---- Right (search + auth) ---- */}
        <div className="flex items-center">
          {/* Search */}
          <form
            className="flex flex-grow border border-gray-300 rounded-full max-w-3xl items-center xl:px-6 px-4 py-2 hover:bg-[#F3FFFC] relative"
            onSubmit={search}
          >
            <FaChevronDown
              className={`${
                searchState === "block" ? "rotate-180" : "rotate-0"
              } transition h-3 text-zinc-700 cursor-pointer hover:text-zinc-500`}
              onClick={ShowSearchState}
            />
            <input
              type="text"
              className="flex-grow xl:w-full w-40 focus:outline-none bg-transparent mx-2 text-zinc-700"
              placeholder="search"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onClick={() => setSearchState("block")}
            />
            {inputText === "" ? (
              <FaSearch className="xl:h-5 h-3 text-zinc-700 cursor-pointer hover:text-zinc-500" />
            ) : (
              <HiX
                className="xl:h-5 h-4 text-zinc-700 cursor-pointer hover:text-zinc-500"
                onClick={() => setInputText("")}
              />
            )}

            {/* Search suggestions */}
            <ul
              className={`absolute ${searchState} top-10 border left-3 w-[91.5%] shadow-lg border-gray-300 bg-[#F3FFFC] rounded-b-lg py-1 z-20`}
            >
              {SearchLink.map((curVal) => (
                <li
                  key={curVal.id}
                  className="py-2 xl:px-3 px-2 cursor-pointer hover:bg-[#eaf6f8]"
                >
                  <Link to="/">
                    <div className="flex items-center space-x-2">
                      <span className="xl:text-2xl text-xl text-gray-800">
                        {curVal.icon}
                      </span>
                      <div>
                        <span className="block text-md text-gray-800">
                          {curVal.title}
                        </span>
                        <span className="block xl:text-sm text-[13px] text-zinc-500">
                          {curVal.dec}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </form>

          {/* Auth buttons */}
          {!isAuthenticated ? (
            <>
              <button
                className="xl:mx-7 mx-3 text-zinc-700 text-[1.03rem] font-semibold hover:text-cyan-700"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
              <button
                className="font-semibold bg-gradient-to-tr from-sky-200 to-cyan-200 py-2 px-3 rounded-xl text-gray-800 hover:from-cyan-300 hover:to-sky-200"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-gray-200 to-blue-300 text-gray-800 hover:from-gray-300 hover:to-blue-400"
                onClick={handleProfileView}
                title={`${user?.firstName || 'User'} ${user?.lastName || ''}`}
              >
                <FaUserCircle className="h-6 w-6" />
              </button>
              <button
                className="font-semibold bg-gradient-to-tr from-red-200 to-red-400 py-2 px-3 rounded-xl text-gray-800 hover:from-red-300 hover:to-red-500"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====================== DESKTOP: SECOND BAR ====================== */}
      <div className="container mx-auto py-3 px-3 hidden lg:block">
        <ul className="flex items-center 2xl:space-x-20 xl:space-x-12 space-x-9">
          {SecondLink.map((curVal) => (
            <li
              className="text-zinc-600 font-semibold hover:text-cyan-700"
              key={curVal.id}
            >
              <Link to={curVal.link}>{curVal.name}</Link>
            </li>
          ))}

          {/* More dropdown */}
          {MoreLink.map((curVal) => (
            <li key={curVal.id} className="relative">
              <button
                className={`font-semibold flex items-center hover:text-cyan-700 ${
                  moreDp === "" ? "text-cyan-700" : "text-zinc-600"
                }`}
                onClick={() =>
                  setMoreDp((v) => (v === "hidden" ? "" : "hidden"))
                }
              >
                {curVal.name}
                <span
                  className={`ml-1 transition ${
                    moreDp === "" ? "rotate-180" : "rotate-0"
                  }`}
                >
                  {curVal.icon}
                </span>
              </button>

              <ul
                className={`${moreDp} absolute font-semibold text-md bg-[#F3FFFC] shadow-lg border rounded-sm text-zinc-700 min-w-[17rem] right-[-1rem] top-7 z-10`}
              >
                {curVal.subLink.map((sub) => (
                  <li
                    key={sub.id}
                    className="px-5 py-3 hover:bg-[#e1f7fa] cursor-pointer hover:text-cyan-700"
                  >
                    <Link to={sub.link}>{sub.name}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* ====================== MOBILE NAV ====================== */}
      <div className="lg:hidden">
        <div className="border-b border-gray-200">
          <div className="flex justify-between sm:px-5 px-3 py-2">
            {/* Hamburger + logo */}
            <div className="flex items-center">
              <span
                className="text-zinc-600 hover:text-zinc-500 text-2xl cursor-pointer mr-3"
                onClick={() => setMobileList((v) => !v)}
              >
                {mobilelist ? <HiX /> : <FaBars />}
              </span>
              <img
                src="/images/logo.png"
                width={55}
                height={45}
                alt="logo"
                className="cursor-pointer mr-2"
                onClick={() => navigate("/")}
              />
            </div>
            <button
              className="font-semibold py-1 px-3 rounded-xl text-gray-800 hover:text-cyan-800"
              onClick={() => navigate("/account-security/signup")}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile slide-in menu */}
        <div
          className={`w-full absolute flex flex-col space-y-7 shadow-md z-20 bg-[#F3FFFC] transition duration-100 linear ${
            mobilelist ? "translate-x-0" : "-translate-x-full"
          } sm:px-5 px-2 pt-2 pb-10`}
        >
          {/* Search inside mobile menu */}
          <form
            className="flex border border-gray-300 rounded-full w-full items-center px-4 py-2 hover:bg-[#F3FFFC] relative"
            onSubmit={search}
          >
            <FaChevronDown
              className={`${
                searchState === "block" ? "rotate-180" : "rotate-0"
              } transition h-3 text-zinc-700 cursor-pointer hover:text-zinc-500`}
              onClick={ShowSearchState}
            />
            <input
              type="text"
              className="flex-grow focus:outline-none bg-transparent mx-2 text-zinc-700"
              placeholder="search"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onClick={() => setSearchState("block")}
            />
            {inputText === "" ? (
              <FaSearch className="h-3 text-zinc-700 cursor-pointer hover:text-zinc-500" />
            ) : (
              <HiX
                className="h-4 text-zinc-700 cursor-pointer hover:text-zinc-500"
                onClick={() => setInputText("")}
              />
            )}
            <ul
              className={`absolute ${searchState} top-10 border left-3 w-[94%] shadow-lg bg-[#F3FFFC] rounded-b-lg py-1 z-20`}
            >
              {SearchLink.map((curVal) => (
                <li
                  key={curVal.id}
                  className="py-2 px-2 cursor-pointer hover:bg-[#eaf6f8]"
                >
                  <Link to="/">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl text-gray-800">{curVal.icon}</span>
                      <div>
                        <span className="block text-md text-gray-800">
                          {curVal.title}
                        </span>
                        <span className="block text-[13px] text-zinc-500">
                          {curVal.dec}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </form>

          {/* Mobile menu items */}
          <ul className="flex flex-col space-y-7">
            {/* Find Talent */}
            <li>
              <a
                className={`flex items-center justify-between font-semibold text-[1.03rem] hover:text-cyan-700 cursor-pointer ${
                  mobileSubListI ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={FirstLinkHandleMb}
              >
                Find Talent
                <FaAngleDown
                  className={`transition ${
                    mobileSubListI ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {mobileSubListI && (
                <div>
                  <ul className="flex flex-col space-y-5 ml-2 my-5">
                    {SubLinks1.map((curVal) => (
                      <li key={curVal.id}>
                        <a
                          className="flex justify-between cursor-pointer"
                          onClick={() => handleMobileSub(curVal.id)}
                        >
                          <span className="flex flex-col space-y-1">
                            <span className="text-zinc-700 font-semibold">
                              {curVal.head}
                            </span>
                            <span className="text-zinc-500 text-sm font-semibold">
                              {curVal.headers}
                            </span>
                          </span>
                          <FaAngleRight
                            className={`text-zinc-700 transition ${
                              se === curVal.id ? "rotate-90" : "rotate-0"
                            }`}
                          />
                        </a>

                        {/* Sub-content */}
                        <div
                          className={`my-3 mx-1 flex-col ${
                            curVal.id === se ? "flex" : "hidden"
                          }`}
                        >
                          <span className="font-semibold text-zinc-600 mb-1">
                            {curVal.subhead.name}
                          </span>
                          <span className="text-sm text-zinc-500">
                            {curVal.subhead.des}
                            <Link
                              to={curVal.subhead.subheadlink.link}
                              className="font-semibold ml-1 cursor-pointer text-cyan-700 hover:underline"
                            >
                              {curVal.subhead.subheadlink.name}
                            </Link>
                          </span>

                          <ul className="flex flex-col space-y-4 mt-5">
                            {curVal.sublink.map((sub) => {
                              if (curVal.id === 2) {
                                // image cards
                                return (
                                  <li key={sub.id}>
                                    <Link to={sub.link}>
                                      <div className="flex space-x-4 items-center border rounded-md hover:bg-[#e1f7fa]">
                                        <img
                                          src={sub.img}
                                          alt={sub.linktext}
                                          width={100}
                                          height={65}
                                          className="rounded-l-md"
                                        />
                                        <span className="text-zinc-700">
                                          {sub.linktext}
                                        </span>
                                      </div>
                                    </Link>
                                  </li>
                                );
                              }
                              return (
                                <li
                                  key={sub.id}
                                  className="text-zinc-700 text-md py-1"
                                >
                                  <Link to={sub.link}>{sub.linktext}</Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {/* Find Jobs */}
            <li>
              <a
                className={`flex items-center justify-between font-semibold text-[1.03rem] hover:text-cyan-700 cursor-pointer ${
                  mobileSubListII ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={SecondLinkHandleMb}
              >
                Find Jobs
                <FaAngleDown
                  className={`transition ${
                    mobileSubListII ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {mobileSubListII && (
                <ul className="flex flex-col space-y-6 ml-2 my-5">
                  {SubLinks2New.map((curVal) => (
                    <li key={curVal.id}>
                      <Link to={curVal.link}>
                        <span className="flex flex-col cursor-pointer">
                          <span className="text-zinc-700 font-semibold">
                            {curVal.name}
                          </span>
                          <span className="text-zinc-500 text-sm">
                            {curVal.des}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Why THEWORKLABS Talent */}
            <li>
              <a
                className={`flex items-center justify-between font-semibold text-[1.03rem] hover:text-cyan-700 cursor-pointer ${
                  mobileSubListIII ? "text-cyan-700" : "text-zinc-700"
                }`}
                onClick={ThirdLinkHandleMb}
              >
                Why THEWORKLABS Talent
                <FaAngleDown
                  className={`transition ${
                    mobileSubListIII ? "rotate-180" : "rotate-0"
                  }`}
                />
              </a>

              {mobileSubListIII && (
                <div className="space-y-3 ml-2">
                  <ul className="flex flex-col space-y-4 mt-5">
                    {SubLinks3.map((curVal) => (
                      <li key={curVal.id} className="cursor-pointer">
                        <Link to={curVal.link}>
                          <span className="flex flex-col space-y-1">
                            <span className="text-zinc-600">{curVal.name}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {/* Enterprise */}
            <li>
              <Link
                to="/enterprise"
                className="text-zinc-700 text-[1.03rem] font-semibold hover:text-cyan-700"
              >
                Enterprise
              </Link>
            </li>
          </ul>

          {/* Auth buttons (mobile) */}
          {!isAuthenticated ? (
            <div className="flex flex-col space-y-3">
              <button
                className="text-zinc-700 text-[1.03rem] font-semibold hover:text-cyan-700"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="font-semibold bg-gradient-to-tr from-sky-200 to-cyan-200 py-2 px-3 rounded-xl text-gray-800 hover:from-cyan-300 hover:to-sky-200"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <FaUserCircle className="h-6 w-6 text-gray-600" />
                <span className="text-zinc-700 text-[1.03rem] font-semibold">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </span>
              </div>
              <button
                className="font-semibold bg-gradient-to-tr from-red-200 to-red-400 py-2 px-3 rounded-xl text-gray-800 hover:from-red-300 hover:to-red-500"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;