import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const PreWork = (props) => {
  const navigate = useNavigate();

  // State for controlling which list is active
  const [activeList, setActiveList] = useState(1);

  const listHandle = (id) => {
    setActiveList(id);
  };

  return (
    <section className="container mx-auto lg:mt-14 mt-5 py-3 md:px-5 sm:px-7 px-3">
      <h2 className="xl:text-4xl text-3xl font-semibold text-zinc-800">
        {props.headText}
      </h2>
      <p className="mt-2 text-zinc-600 xl:text-xl sm:text-lg text-md">
        {props.headDes}
      </p>

      <motion.div
        className="2xl:px-10 xl:px-5 lg:px-3 md:px-0 sm:px-2 px-0 lg:mt-9 mt-5"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="flex md:flex-row flex-col lg:space-x-20 md:space-x-10 space-x-0 justify-between bg-gradient-to-b from-cyan-100 to-teal-100 rounded-xl shadow-sm">
          <div className="sm:pl-7 pl-4 py-3 flex flex-col justify-between items-start">
            <ul className="flex flex-col sm:space-y-3 space-y-2">
              {props.list.map((curVal) => (
                <li
                  key={curVal.id}
                  className={`cursor-pointer sm:text-lg text-md font-semibold flex items-center duration-200 ease-in hover:text-zinc-700 ${
                    activeList === curVal.id
                      ? "text-zinc-800 ml-2"
                      : "text-zinc-500"
                  }`}
                  onClick={() => listHandle(curVal.id)}
                >
                  {curVal.name}
                </li>
              ))}
            </ul>

            <button
              className="bg-zinc-800 md:px-6 px-5 md:mr-0 mr-3 py-2 mb-3 transition text-white rounded-full font-semibold hover:bg-zinc-700 mt-3"
              onClick={() => navigate("#")}
            >
              {props.btn.text}
            </button>
          </div>

          {/* Dynamic image display */}
          <div
            style={{
              backgroundImage: `url(${
                props[`image${["I", "II", "III", "Iv", "V", "Vi"][activeList - 1]}`]
              })`,
            }}
            className="md:w-[60%] w-full md:h-[475px] h-[250px] bg-no-repeat bg-cover md:rounded-r-xl md:rounded-bl-none rounded-b-xl"
          ></div>
        </div>
      </motion.div>
    </section>
  );
};

export default PreWork;
