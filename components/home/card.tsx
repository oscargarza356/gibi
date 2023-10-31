import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import Balancer from "react-wrap-balancer";
import Countdown from "react-countdown";
import { count } from "node:console";
export default function Card({
  title,
  description,
  demo,
  large,
  countDownDate,
  openseaLink,
}: {
  title: string;
  description: string;
  demo: ReactNode;
  large?: boolean;
  countDownDate: Date;
  openseaLink?: string;
}) {
  const currentDate = new Date();

  let isCountdownOver = false;
  if (currentDate > countDownDate) {
    isCountdownOver = true;
  }
  console.log(countDownDate, title);

  return (
    <div className={`relative col-span-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md ${large ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-center">{demo}</div>
      <div className="mx-auto max-w-md px-2">
        <h4 className="bg-gradient-to-br from-black to-stone-500 bg-clip-text font-display text-md font-bold text-transparent md:text-lg md:font-normal">
          {title}
        </h4>
        <h4 className="text-gray-700 text-md font-bold md:text-lg md:font-normal">
          Ending in {isCountdownOver ? "Countdown has passed" : <Countdown date={countDownDate} />}
        </h4>

        <a href={openseaLink} className="font-normal text-blue-600 dark:text-blue-500 hover:underline">
          OpenSea⛵
        </a>
      </div>
    </div>
  );
}
