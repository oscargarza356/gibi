/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { getPublicClient } from "@wagmi/core";
import { Network, Alchemy } from "alchemy-sdk";
import Image from "next/image";
import Balancer from "react-wrap-balancer";
import Popover from "@/components/shared/popover";
import { useCreateGIBIModal } from "@/components/home/create-giveaway-modal";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
export default function CreateGiveaway() {
  const [programError, setProgramError] = useState("");
  const [giveawayInfo, setGiveawayInfo] = useState<any>({});
  const [NFTImage, setNFTImage] = useState("");
  const [NFTName, setNFTName] = useState("");
  const [giveawayLink, setGiveawayLink] = useState("");
  const [tweetLink, setTweetLink] = useState<any>("");
  const { DemoModal, setShowDemoModal, setModalText, setHashText, setLoadingBar } = useCreateGIBIModal();
  const { address } = useAccount();
  const router = useRouter();
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.MATIC_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  useEffect(() => {
    loadGiveawayInfo();
  }, []);

  async function loadGiveawayInfo() {
    // append /id to url
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    if (!giveawayId) {
      setProgramError("No giveaway id provided");
      return;
    }
    console.log("giveawayId", giveawayId);
    const getGiveawayUrl = process.env.NEXT_PUBLIC_GET_GIVEAWAY_URL + giveawayId;
    console.log("getGiveawayUrl", getGiveawayUrl);
    await fetch(getGiveawayUrl, {})
      .then((response) => response.json())
      .then(async (data) => {
        console.log("data", data);
        setGiveawayInfo(data);
        // load nft image
        const publicClient = getPublicClient({
          chainId: 137,
        });
        console.log("giveawayInfo.token", data.nft_token_id);
        const response2 = await alchemy.nft.getNftMetadata(data.nft_contract_Address, data.nft_token_id);
        console.log("image url: ", response2?.rawMetadata?.image);
        setNFTImage(response2?.media[0].gateway);
        setNFTName(response2?.rawMetadata?.name as any);
        setGiveawayLink("https://www.gibi.app/participate_giveaway?giveaway_id=" + giveawayId);
      })
      .catch((error) => {
        console.error("Error:", error);
        setProgramError("Error: " + error);
      });
  }

  async function updateTweetLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    const drawWinnerUrl = (process.env.NEXT_PUBLIC_UPDATE_TWITTER_LINK as string) + giveawayId;
    console.log("drawWinnerUrl", drawWinnerUrl);

    // get x signature and message from local storage
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);

    console.log("storedSignature", storedSignature);

    const response = await fetch(drawWinnerUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        x_signature: storedSignature,
        x_message: storedMessage,
        tweet_link: tweetLink,
      }),
    });
    const responseJson = await response.json();
    console.log("responseJson", responseJson);
    if (!response.ok) {
      // get response json
      setProgramError("Error: " + responseJson.error);
      return;
    }
    // set modal text
    setLoadingBar(false);
    setModalText("Tweet Link Updated✔️, giveaway is now active you will be redirected in a bit.");
    setShowDemoModal(true);
    // set 3 second timer
    setTimeout(() => {
      router.push("/participate_giveaway" + "?giveaway_id=" + giveawayId);
    }, 3000);
  }

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="flex items-center justify-center">
          <Image src="/giveaway.png" alt="GIBI Logo" width={250} height={100} />
        </div>
        <div className="flex items-center justify-center">
          <h1 className={`text-gray-600  bg-clip-text font-display font-bold tracking-[-0.02em] drop-shadow-sm md:text-3xl min-[320px]:text-2xl`}>
            {NFTName}
          </h1>
        </div>
        <div className="flex items-center justify-center">
          <img src={NFTImage} width={250} height={250} className="rounded-xl shadow-md dark:shadow-gray-800" />
        </div>
        <h1
          className={
            "text-black  bg-gradient-to-br to-pink-500 bg-clip-text text-center font-display font-bold tracking-[-0.02em] drop-shadow-sm md:text-5xl min-[320px]:text-3xl min-[320px]:leading-[3rem] md:leading-[5rem] sm:text-6xl mb-2"
          }>
          <Balancer>🎁</Balancer>
        </h1>
        <div />

        {giveawayInfo.status === "pending tweet" ? (
          <div>
            <div className=" items-center justify-center md:flex md:items-center">
              <div className=" items-center justify-center md:w-2/3">
                <label className="text-gray-500 font-bold mb-1 pr-4">𝕏 Tweet Link</label>
                <div className="items-center justify-center">
                  <input
                    className="items-center justify-center  bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    id="tweet_link"
                    placeholder="i.e https://twitter.com/MaskedDAO/status/1685057132259909632"
                    onChange={(e) => {
                      setTweetLink(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className=" items-center justify-center flex items-center">
                  <button
                    type="submit"
                    className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-6 py-2 text-lg font-bold text-white transition-colors mt-5 "
                    onClick={updateTweetLink}>
                    Set Tweet Link
                  </button>
                </div>
              </div>
            </div>
            <DemoModal />
            <h1 className="text-red-500  text-center">{programError}</h1>
            <h1 className="text-center">
              We recommend attaching the giveaway link to your tweet{" "}
              <a href={giveawayLink} className="text-blue-500	 underline font-bold">
                {giveawayLink}{" "}
              </a>{" "}
            </h1>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className=" items-center justify-center flex items-center">
                <button
                  type="submit"
                  className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-6 py-2 text-lg font-bold text-white transition-colors mt-5 ">
                  Link can&#39;t be updated
                </button>
              </div>
            </div>
            <DemoModal />
            <h1 className="text-red-500  text-center">{programError}</h1>
          </div>
        )}
      </div>
    </>
  );
}
