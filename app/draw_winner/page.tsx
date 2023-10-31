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

export default function DrawWinner() {
  const [programError, setProgramError] = useState("");
  const [giveawayInfo, setGiveawayInfo] = useState<any>({});
  const [NFTImage, setNFTImage] = useState("");
  const [NFTName, setNFTName] = useState("");
  const [openPopover, setOpenPopover] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState<any>("");
  const { DemoModal, setShowDemoModal, setModalText, setHashText, setLoadingBar } = useCreateGIBIModal();
  const { address } = useAccount();
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
        setNFTImage(response2?.media[0].gateway);
        setNFTName(response2?.rawMetadata?.name as any);
      })
      .catch((error) => {
        console.error("Error:", error);
        setProgramError("Error: " + error);
      });
  }

  async function disqualifyWinner() {
    if (disqualifyReason === "") {
      setProgramError("Please choose a disqualify reason");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    const disqualifyWinnerUrl = (process.env.NEXT_PUBLIC_DISQUALIFY_WINNER_URL as string) + giveawayId;
    console.log("disqualifyWinnerUrl", disqualifyWinnerUrl);

    // get x signature and message from local storage
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);

    console.log("storedSignature", storedSignature);

    const response = await fetch(disqualifyWinnerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        redraw: true,
        disqualified_reason: disqualifyReason,
        x_signature: storedSignature,
        x_message: storedMessage,
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
    setModalText(giveawayInfo.winner + " disqualified🔨 new winner " + responseJson.winner + "🏆");
    // need to set the name of the new winner to the giveaway info
    setGiveawayInfo({ ...giveawayInfo, winner: responseJson.winner });
    setShowDemoModal(true);
  }

  async function drawWinner() {
    const urlParams = new URLSearchParams(window.location.search);
    const giveawayId = urlParams.get("giveaway_id");
    const drawWinnerUrl = (process.env.NEXT_PUBLIC_DISQUALIFY_WINNER_URL as string) + giveawayId;
    console.log("drawWinnerUrl", drawWinnerUrl);

    // get x signature and message from local storage
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);

    console.log("storedSignature", storedSignature);

    const response = await fetch(drawWinnerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        x_signature: storedSignature,
        x_message: storedMessage,
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
    setModalText("Winner drawn " + responseJson.winner + "🏆");
    setGiveawayInfo({ ...giveawayInfo, winner: responseJson.winner });
    setShowDemoModal(true);
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
        {giveawayInfo.winner === "" ? (
          <div className="z-10 w-full max-w-xl px-5 xl:px-0">
            <div className="flex flex-col items-center justify-center space-y-4">
              <button
                type="submit"
                onClick={drawWinner}
                className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-6 py-2 text-lg font-bold text-white transition-colors mt-5">
                Draw Winner
              </button>

              <DemoModal />
              <h1 className="text-red-500 items-center">{programError}</h1>
            </div>
          </div>
        ) : (
          <div className="z-10 w-full max-w-xl px-5 xl:px-0">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className=" items-center justify-center md:flex md:items-center">
                <div className=" items-center justify-center ">
                  <label className="font-bold text-yellow-500 font-bold">🏆Winner🏆</label>
                </div>
              </div>
              <div className=" items-center justify-center md:flex md:items-center ">
                <div className=" items-center justify-center ">
                  <a href={`https://twitter.com/${giveawayInfo.winner}`} className="text-blue-500	 underline font-bold">
                    @{giveawayInfo.winner}
                  </a>
                </div>
              </div>
              <div>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className=" items-center justify-center md:flex md:items-center">
                    <Popover
                      content={
                        <div className="w-full rounded-md bg-white p-2 sm:w-40">
                          <button
                            className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                            onClick={() => {
                              setDisqualifyReason("Didn't Follow");
                              setOpenPopover(!openPopover);
                            }}>
                            Didn&#39;t Follow
                          </button>
                          <button
                            className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                            onClick={() => {
                              setDisqualifyReason("Didn't Retweet");
                              setOpenPopover(!openPopover);
                            }}>
                            Didn&#39;t Retweet
                          </button>
                          <button
                            className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                            onClick={() => {
                              setDisqualifyReason("Didn't comment");
                              setOpenPopover(!openPopover);
                            }}>
                            Didn&#39;t Comment
                          </button>
                        </div>
                      }
                      openPopover={openPopover}
                      setOpenPopover={setOpenPopover}>
                      <button
                        onClick={() => setOpenPopover(!openPopover)}
                        className="flex w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100">
                        {disqualifyReason === "" ? (
                          <p className="text-gray-600">Choose Disqualify Reason</p>
                        ) : (
                          <p className="text-gray-600">{disqualifyReason}</p>
                        )}
                      </button>
                    </Popover>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className=" items-center justify-center flex items-center">
                      <button
                        type="submit"
                        onClick={disqualifyWinner}
                        className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-6 py-2 text-lg font-bold text-white transition-colors mt-5 ">
                        Disqualify Winner and Re-draw
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className=" items-center justify-center flex items-center">
                      <label className="text-center">Only disqualify users that you are sure of not completing requirements </label>
                    </div>
                  </div>
                </div>
                <DemoModal />

                <h1 className="text-red-500 items-center">{programError}</h1>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
