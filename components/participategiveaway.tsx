"use client";

import Balancer from "react-wrap-balancer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { getAccount } from "@wagmi/core";
import { watchAccount } from "@wagmi/core";
import React from "react";
import { useDemoModal } from "@/components/home/demo-modal";
import { getPublicClient } from "@wagmi/core";
import { Network, Alchemy } from "alchemy-sdk";
import Image from "next/image";
import Countdown from "react-countdown";

export default function ParticipateInGiveaway() {
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [discordVerified, setDiscordVerified] = useState(false);
  const [socialVerified, setSocialVerified] = useState(false);
  const [giveawayInfo, setGiveawayInfo] = useState({} as any);
  const [NFTImage, setNFTImage] = useState("");
  const [NFTName, setNFTName] = useState("");
  const [error, setError] = useState("");
  const { DemoModal, setShowDemoModal } = useDemoModal();
  const [isMember, setIsMember] = useState(false);
  const [countDownDate, setCountDownDate] = useState(null);
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.MATIC_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  // read url and extract giveaway id /participate_giveaway?giveaway_id=
  const urlParams = new URLSearchParams(window.location.search);
  const giveawayId = urlParams.get("giveaway_id");
  console.log("giveawayId", giveawayId);
  // discord
  const CLIENT_ID = "1093967292070633622";
  const REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI as string;
  const SCOPE = "identify guilds guilds.members.read";
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=token&code&scope=${encodeURIComponent(SCOPE)}&state=${giveawayId}`;
  // twitter
  const TWITTER_CLIENT_ID = "dmxhNDNnTmhoMVB3VkRZbWpCaXc6MTpjaQ";
  const TWITTER_REDIRECT_URI = (process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI as string) + "?giveaway_id=" + giveawayId;
  const TWITTER_SCOPE = "tweet.read users.read follows.read follows.write tweet.write";
  const twitterAuthUrl =
    "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=" +
    TWITTER_CLIENT_ID +
    "&redirect_uri=" +
    TWITTER_REDIRECT_URI +
    "&scope=tweet.read%20tweet.write%20users.read%20offline.access%20follows.read%20follows.write&state=state&code_challenge=challenge&code_challenge_method=plain";
  // wallet
  const account = getAccount();
  const unwatch = watchAccount((account) => {
    if (account.isConnected) {
      console.log("connected");
      console.log(twitterVerified, discordVerified);
      if (twitterVerified && discordVerified) {
        setSocialVerified(true);
      }
    }
  });

  useEffect(() => {
    loadGiveawayAndCheckSocialLogins();
  }, []);

  async function loadGiveawayAndCheckSocialLogins() {
    // append /id to url
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    let discordVerification = false;
    let twitterVerification = false;
    if (!giveawayId) {
      setError("No giveaway id provided");
      return;
    }
    console.log("giveawayId", giveawayId);
    const getGiveawayUrl = process.env.NEXT_PUBLIC_GET_GIVEAWAY_URL + giveawayId;
    console.log("getGiveawayUrl", getGiveawayUrl);
    let guild_id = "";
    let discord_invite_link = "";
    await fetch(getGiveawayUrl, {})
      .then((response) => response.json())
      .then(async (data) => {
        console.log("data", data);
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

        discord_invite_link = data.discord_invite_link;
        console.log("discord_invite_link111", discord_invite_link);
        setGiveawayInfo(data);

        // load nft image
        const publicClient = getPublicClient({
          chainId: 137,
        });
        console.log("giveaway", data);
        console.log("giveawayInfo.token", data.nft_token_id);
        const response2 = await alchemy.nft.getNftMetadata(data.nft_contract_Address, data.nft_token_id);
        console.log("image url: ", response2?.rawMetadata?.image);
        setNFTImage(response2?.media[0].gateway);
        setNFTName(response2?.rawMetadata?.name as any);
        console.log("nft image", NFTImage);
        console.log("nft name", NFTName);
        console.log("heere", response2?.media[0].gateway);
        guild_id = data.discord_guild_id;
      });
    // discord
    console.log("production discord call");

    if (localStorage.getItem("discordToken") && isMember == false) {
      // check if the token has expired
      const expirationTimeUTC = localStorage.getItem("discordTokenExpiration");
      const expirationTime = new Date(expirationTimeUTC as string).getTime();
      const now = new Date().getTime();
      if (now > expirationTime) {
        // token has expired
        localStorage.removeItem("discordToken");
        localStorage.removeItem("discordTokenExpiration");
        setDiscordVerified(false);
      } else {
        console.log("expirationTime hasn't expired discord", expirationTime);
        console.log("now", now);

        console.log("Discord expirationTime hasn't expired", expirationTime);
        console.log("now", now);
        console.log("discordToken", localStorage.getItem("discordToken"));
        const accessToken = localStorage.getItem("discordToken");
        // check if the user is part of the discord server
        const response = await fetch("https://discord.com/api/users/@me/guilds/" + guild_id + "/member", {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        });
        const data = await response.json();
        // check that the response return ok
        if (!response.ok) {
          if (response.status == 429) {
            setError("discord rate limit hit, please try again in " + data.retry_after + "seconds");
            console.log("response.status", response.status);
          }
        } else {
          discordVerification = true;
          setIsMember(true);
        }
        console.log("response", !response.ok);

        setDiscordVerified(true);
      }
    }
    if (discord_invite_link == "") {
      console.log("discord_invite_link", discord_invite_link);
      setDiscordVerified(true);
    }
    // twitter
    if (localStorage.getItem("twitterToken")) {
      const expirationTimeUTC = localStorage.getItem("twitterTokenExpiration");
      const expirationTime = new Date(expirationTimeUTC as string).getTime();
      const now = new Date().getTime();
      if (now > expirationTime) {
        // token has expired
        localStorage.removeItem("twitterToken");
        localStorage.removeItem("twitterTokenExpiration");
        localStorage.removeItem("twitterUsername");
        setTwitterVerified(false);
      } else {
        // token has not expired
        console.log("expirationTime hasn't expired twitter", expirationTime);
        console.log("now", now);
        twitterVerification = true;
        setTwitterVerified(true);
      }
    }

    // wallet
    console.log("discord invite link", discord_invite_link);
    if (discordVerification && twitterVerification && account.isConnected) {
      setSocialVerified(true);
      console.log("account.isConnected", account.isConnected);
    } else if (twitterVerification && discord_invite_link == "" && account.isConnected) {
      console.log("account.isConnected", account.isConnected);
      setSocialVerified(true);
    } else {
      console.log("account not conneeet");
      setSocialVerified(false);
    }
  }

  // called after logged in all apps
  async function participateInGiveaway() {
    console.log(
      "giveawayId",
      giveawayId,
      "account.address",
      account.address,
      "discordToken",
      localStorage.getItem("discordToken"),
      "twitterToken",
      localStorage.getItem("twitterToken")
    );
    const response = await fetch(process.env.NEXT_PUBLIC_PARTICIPATE_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        giveaway_id: giveawayId,
        wallet_address: account.address,
        discord_token: localStorage.getItem("discordToken"),
        twitter_token: localStorage.getItem("twitterToken"),
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
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
        <img src={NFTImage} className="rounded-xl shadow-md dark:shadow-gray-800" />
        <h1
          className={
            "text-black animate-fade-up bg-gradient-to-br to-pink-500 bg-clip-text text-center font-display font-bold tracking-[-0.02em] drop-shadow-sm md:text-5xl min-[320px]:text-3xl min-[320px]:leading-[3rem] md:leading-[5rem] sm:text-6xl"
          }
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
          <Balancer>🎁</Balancer>
        </h1>

        <div
          className="mx-auto mt-5 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <ConnectButton />
        </div>

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
                        stroke-linecap="round"
                        stroke-linejoin="round"
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
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="w-8 h-8">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
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
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="w-8 h-8">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
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
