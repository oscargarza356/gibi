"use client";

import Balancer from "react-wrap-balancer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import React from "react";
import { useDemoModal } from "@/components/home/demo-modal";
import Image from "next/image";
import Countdown from "react-countdown";
import { useAccount, useAccountEffect, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

export default function ParticipateInGiveaway() {
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [discordVerified, setDiscordVerified] = useState(false);
  const [socialVerified, setSocialVerified] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [giveawayInfo, setGiveawayInfo] = useState({} as any);
  const [NFTImage, setNFTImage] = useState("");
  const [NFTName, setNFTName] = useState("");
  const [error, setError] = useState("");
  const { DemoModal, setShowDemoModal } = useDemoModal();
  const [isMember, setIsMember] = useState(false);
  const [countDownDate, setCountDownDate] = useState(null);
  const [giveawayId, setGiveawayId] = useState("");
  const [discordFlag, setDiscordFlag] = useState(false);
  const [discordAuthUrl, setDiscordAuthUrl] = useState("");
  const [twitterAuthUrl, setTwitterAuthUrl] = useState("");
  const { signMessageAsync } = useSignMessage();
  const account = useAccount();
  const [signatureCheck, setSignatureCheck] = useState(false);

  const [localStorageData, setLocalStorageData] = useState(null);
  // Function to handle changes in local storage
  const handleLocalStorageChange = () => {
    console.log("Local storage changed");
    checkSocials(giveawayId as string, discordFlag, account.address as string);
  };

  // wallet
  useAccountEffect({
    onConnect(data) {
      setSignedIn(true);

      testSignature(data.address, discordFlag);
      console.log("ee");
      const urlParams = new URLSearchParams(window.location.search);
      const giveawayId = urlParams.get("giveaway_id");
    },
    onDisconnect() {
      console.log("Disconnected!");
      setSignedIn(false);
    },
  });

  useEffect(() => {
    loadGiveaway();
    // read url and extract giveaway id /participate_giveaway?giveaway_id=
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    setGiveawayId(giveawayId as string);
    // discord
    const CLIENT_ID = "1093967292070633622";
    const REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI as string;
    const SCOPE = "identify guilds guilds.members.read";
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(SCOPE)}&state=**${giveawayId}`;
    setDiscordAuthUrl(discordAuthUrl);
    // twitter
    const TWITTER_CLIENT_ID = "dmxhNDNnTmhoMVB3VkRZbWpCaXc6MTpjaQ";
    const TWITTER_REDIRECT_URI = (process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI as string) + "?giveaway_id=" + giveawayId;
    const TWITTER_SCOPE = "tweet.read users.read follows.read follows.write tweet.write";
    setTwitterAuthUrl(
      "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=" +
        TWITTER_CLIENT_ID +
        "&redirect_uri=" +
        TWITTER_REDIRECT_URI +
        "&scope=tweet.read%20tweet.write%20users.read%20offline.access%20follows.read%20follows.write&state=state&code_challenge=challenge&code_challenge_method=plain"
    );
  }, []);

  async function checkSocials(giveawayId: string, discordFlag: boolean, address: string) {
    let discordVerification = false;
    // call backend to check if user is member of discord server
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);
    console.log("storedSignature", storedSignature);
    let discordVerified = false;
    let twitterVerified = false;
    if (storedSignature || storedMessage) {
      if (discordFlag) {
        // check if the user already has discord token  if it is then check if it is part of the server
        const response = await fetch(process.env.NEXT_PUBLIC_DISCORD_GIVEAWAY_AUTH as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            giveaway_id: giveawayId,
            x_signature: storedSignature,
            x_message: storedMessage,
            wallet_address: address,
          }),
        }).then(async (response) => {
          let data = await response.json();
          console.log("data", data);
          console.log("statuuus", response.status);
          // if response status is 200, user is member of discord server
          if (response.status == 200) {
            console.log("heeeere");
            setDiscordVerified(true);
            setIsMember(true);
            discordVerified = true;
          } else if (data.code == 10004) {
            setDiscordVerified(true);
            setIsMember(false);
          }
        });
      }
      // check if the user already has twitter token  if it is then check if it is part of the server
      const responseTwitter = await fetch(process.env.NEXT_PUBLIC_TWITTER_LINKED_AUTH as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: address,
          x_signature: storedSignature,
          x_message: storedMessage,
        }),
      }).then(async (response) => {
        let data = await response.json();
        console.log("data", data);
        console.log("statuuus", response.status);
        // if response status is 200, user is member of discord server
        if (response.status == 200) {
          console.log("heeeere");
          setTwitterVerified(true);
          twitterVerified = true;
        }
      });
      console.log("discordVerified", discordVerified);
      console.log("twitterVerified", twitterVerified);
      if (discordVerified && twitterVerified) {
        setSocialVerified(true);
      }
      if (!discordFlag && twitterVerified) {
        setSocialVerified(true);
      }
    } else {
      setSignedIn(false);
    }
  }

  async function testSignature(address: any, discordFlag: boolean) {
    console.log("aaa");
    // get signature and message from local storage
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);
    if (!storedSignature || !storedMessage) {
      const message = createSiweMessage(address);
      try {
        let signature = await signMessageAsync({ message: message });
        localStorage.setItem("signature" + address, signature);
        localStorage.setItem("message" + address, message);
        setSignatureCheck(true);
        checkSocials(giveawayId as string, discordFlag, address);
      } catch (e) {
        console.log(e);
      }
    } else {
      checkSocials(giveawayId as string, discordFlag, address);
      setSignatureCheck(true);
    }
  }
  function createSiweMessage(address: any) {
    const domain = window.location.host;
    const message = new SiweMessage({
      domain,
      address: address,
      statement: "Sign in with Ethereum to the app.",
      uri: origin,
      version: "1",
      chainId: 137,
    });
    return message.prepareMessage();
  }

  async function loadGiveaway() {
    // append /id to url
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    if (!giveawayId) {
      setError("No giveaway id provided");
      return;
    }

    console.log("giveawayId", giveawayId);
    const getGiveawayUrl = process.env.NEXT_PUBLIC_GET_GIVEAWAY_URL + giveawayId;
    console.log("getGiveawayUrl", getGiveawayUrl);
    await fetch(getGiveawayUrl, {})
      .then((response) => response.json())
      .then(async (data) => {
        console.log("data 1111111", data);
        console.log("data end_date", data.end_date);
        // Create a Date object from the UTC string
        const utcDate = new Date(data.end_date);
        // Get the user's local time as a string
        const localTimeString = utcDate.toLocaleString();
        console.log("localTimeString", localTimeString);
        const localTime = new Date() as any;
        const timeDifference = (utcDate as any) - localTime;
        if (timeDifference > 0) {
          setCountDownDate(localTimeString as any);
        }
        setGiveawayInfo(data);
        setNFTImage(data.image_link);
        setNFTName(data.prize);

        let discordFlag = false;
        if (data.discord_invite_link != "") {
          discordFlag = true;
          setDiscordFlag(true);
        }
        if (account.address) {
          console.log("are we here?");
          setSignedIn(true);
          testSignature(account.address, discordFlag);
        }
      });
  }

  // called after logged in all apps
  async function participateInGiveaway() {
    console.log("giveawayId", giveawayId, "account.address", account.address);
    const response = await fetch(process.env.NEXT_PUBLIC_PARTICIPATE_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        giveaway_id: giveawayId,
        wallet_address: account.address,
        x_signature: localStorage.getItem("signature" + account.address),
        x_message: localStorage.getItem("message" + account.address),
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
        console.log("error", error);
        setError(error.error);
      } else {
        setShowDemoModal(true);
      }
    });
  }

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="flex items-center justify-center">
          <Image src="/giveaway.png" alt="GIBI Logo" width={450} height={200} />
        </div>
        {countDownDate ? (
          <div>
            <div
              className="mx-auto flex animate-fade-up items-center justify-center opacity-0"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <p className="items-center justify-center font-bold md:text-xl min-[320px]:text-lg text-gray-800">Time left</p>
            </div>
            <div
              className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0 md:text-xl min-[320px]:text-lg text-gray-800"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <Countdown date={countDownDate} />
            </div>
          </div>
        ) : giveawayInfo.status == "draw pending" ? (
          <div
            className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0 md:text-xl min-[320px]:text-lg text-gray-800"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <p className="items-center justify-center font-bold">Ended, winner is announced 30 minutes after giveaway closing.</p>
          </div>
        ) : giveawayInfo.status == "completed" ? (
          <div>
            <div
              className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0 md:text-xl min-[320px]:text-lg text-gray-800"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <p className="items-center justify-center font-bold">Ended</p>
            </div>
            <div
              className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0 md:text-xl min-[320px]:text-lg text-gray-800"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <p className="items-center justify-center font-bold text-yellow-500	">
                🏆Winner{" "}
                <a href={`https://twitter.com/${giveawayInfo.winner}`} className="underline">
                  @{giveawayInfo.winner}🏆
                </a>
              </p>
            </div>
          </div>
        ) : null}
        <div className="flex items-end justify-between">
          <h1
            className={`text-gray-600 animate-fade-up   bg-clip-text font-display font-bold tracking-[-0.02em] drop-shadow-sm md:text-3xl min-[320px]:text-2xl`}
            style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            {NFTName}
          </h1>
          <h1
            className={`text-gray-500 animate-fade-up   bg-clip-text font-display tracking-[-0.02em] drop-shadow-sm md:text-xl`}
            style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            {giveawayInfo.num_of_participants} Participants
          </h1>
        </div>
        <div className="flex items-center justify-center">
          <Image src={NFTImage} alt="Prize image" className="rounded-xl shadow-md dark:shadow-gray-800 items-center" width={450} height={450} />
        </div>
        <h1
          className={
            "text-black animate-fade-up bg-gradient-to-br to-pink-500 bg-clip-text text-center font-display font-bold tracking-[-0.02em] drop-shadow-sm md:text-5xl min-[320px]:text-3xl min-[320px]:leading-[3rem] md:leading-[5rem] sm:text-6xl"
          }
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
          <Balancer>🎁</Balancer>
        </h1>

        {signedIn && signatureCheck ? (
          <div>
            {giveawayInfo.discord_invite_link != "" ? (
              <div
                className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
                style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
                {!discordVerified ? (
                  <a
                    className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-white hover:text-black"
                    href={discordAuthUrl}
                    rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:text-black" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <g id="图层_2" data-name="图层 2">
                        <g id="Discord_Logos" data-name="Discord Logos">
                          <g id="Discord_Logo_-_Large_-_White" data-name="Discord Logo - Large - White">
                            <path
                              className="cls-1"
                              d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        </g>
                      </g>
                    </svg>
                    <p>Discord Login</p>
                  </a>
                ) : !isMember ? (
                  <div>
                    <a
                      className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-white hover:text-black"
                      onClick={() => window.open(giveawayInfo.discord_invite_link, "_blank")}
                      rel="noopener noreferrer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 group-hover:text-black"
                        viewBox="0 0 127.14 96.36"
                        fill="currentColor">
                        <g id="图层_2" data-name="图层 2">
                          <g id="Discord_Logos" data-name="Discord Logos">
                            <g id="Discord_Logo_-_Large_-_White" data-name="Discord Logo - Large - White">
                              <path
                                className="cls-1"
                                d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </g>
                          </g>
                        </g>
                      </svg>
                      <p>Join server</p>
                    </a>
                    <p>reload page after joining</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Discord Verified✔️</p>
                )}
              </div>
            ) : null}
            <div
              className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              {!twitterVerified ? (
                <a
                  className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-white hover:text-black"
                  href={twitterAuthUrl}
                  rel="noopener noreferrer">
                  <svg className="h-7 w-7 group-hover:text-black" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p>Twitter Login</p>
                </a>
              ) : (
                <p>Twitter Verified✔️</p>
              )}
            </div>
            <div
              className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              {!socialVerified ? (
                <button className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-8 py-3 text-lg font-bold text-white transition-colors">
                  {" "}
                  Login to Participate
                </button>
              ) : (
                <button
                  className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-black px-8 py-3 text-lg font-bold text-lime-400 transition-colors"
                  onClick={() => participateInGiveaway()}>
                  {" "}
                  Click to Participate
                </button>
              )}
              <br />
            </div>
          </div>
        ) : signedIn ? (
          <div
            className="mx-auto mt-5 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <button
              className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-white hover:text-black"
              onClick={() => testSignature(account.address, discordFlag)}>
              {" "}
              Click to Sign In
            </button>
          </div>
        ) : (
          <div
            className="mx-auto mt-5 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <ConnectButton />
          </div>
        )}

        <div
          className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0 md:text-xl min-[320px]:text-lg mt-6"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          {giveawayInfo.comment_check || giveawayInfo.retweet_check || giveawayInfo.comment_check ? (
            <ul className="w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg ">
              {giveawayInfo.follow_account != "" ? (
                <li className="w-full border-b border-gray-200 rounded-t-lg ">
                  <div className="flex items-center pl-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="w-8 h-8">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                    <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 ">
                      Please{" "}
                      <a
                        href={`https://twitter.com/${giveawayInfo.follow_account}`}
                        className="text-blue-500	 underline font-bold"
                        target="_blank"
                        rel="noopener noreferrer">
                        follow
                      </a>{" "}
                    </label>
                  </div>
                </li>
              ) : null}
              {giveawayInfo.retweet_check ? (
                <li className="w-full border-b border-gray-200 rounded-t-lg ">
                  <div className="flex items-center pl-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-8 h-8">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                    <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 ">
                      Please{" "}
                      <a href={giveawayInfo.tweet_link} className="text-blue-500	 underline font-bold" target="_blank" rel="noopener noreferrer">
                        retweet
                      </a>
                    </label>
                  </div>
                </li>
              ) : null}
              {giveawayInfo.comment_check ? (
                <li className="w-full border-b border-gray-200 rounded-t-lg ">
                  <div className="flex items-center pl-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-8 h-8">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                    <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 ">
                      Please{" "}
                      <a href={giveawayInfo.tweet_link} className="text-blue-500	 underline font-bold" target="_blank" rel="noopener noreferrer">
                        comment
                      </a>
                    </label>
                  </div>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <div
          className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <p className="items-center justify-center text-red-500">{error}</p>
        </div>
        <DemoModal />
      </div>
    </>
  );
}
