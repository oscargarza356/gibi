/* eslint-disable @next/next/no-img-element */
"use client";

import { createPublicClient, http, formatUnits } from "viem";
import { useState, useRef, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import GibiBase from "../../contracts/GibiBase.json";
import PixelOpepen from "../../contracts/PixelOpepen.json";
import "flatpickr/dist/themes/material_green.css";
import flatpickr from "flatpickr";
import { useCreateGIBIModal } from "@/components/home/create-giveaway-modal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useNftModal } from "@/components/home/nft-modal";
import { Network, Alchemy } from "alchemy-sdk";
import { useERC20Modal } from "@/components/home/erc20-modal";
import { useWriteContract, useClient, useChains, useAccount, useChainId } from "wagmi";
import BasedCoin from "../../contracts/BasedCoin.json";
import { base, polygon } from 'viem/chains'

export default function CreateGiveaway() {
  const [tokenId, setTokenId] = useState("");
  const [nftAddress, setNftAddress] = useState("");
  const client = useClient();
  const { writeContractAsync } = useWriteContract();
  const account = useAccount();
  const router = useRouter();
  const fp = useRef(flatpickr as any);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUnixTime, setSelectedUnixTime] = useState(0);
  const { DemoModal, setShowDemoModal, setModalText, setHashText } = useCreateGIBIModal();
  const [programError, setProgramError] = useState("");
  const [discord, setDiscord] = useState("");
  const [discordServerName, setDiscordServerName] = useState("");
  const [discordGuildID, setDiscordGuildID] = useState("");
  const [erc20Active, setErc20Active] = useState(false);
  const { NftModal, setShowNftModal } = useNftModal();
  const { ERC20Modal, setShowERC20Modal } = useERC20Modal();
  const [choosenNft, setChoosenNft] = useState<any>(null);
  const [nftButtonText, setnftButtonText] = useState<String>("Attach NFT");
  const [isERC1155, setIsERC1155] = useState(false);
  const [amount, setAmount] = useState(0);
  const chains = useChains();
  const chainId = useChainId();

  // aclhemy set up
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.BASE_MAINNET,
  };
  const alchemy = new Alchemy(settings);

  useEffect(() => {
    checkURLParameters();
  }, []);

  async function checkURLParameters() {
    // check for nftTokenAddress=0x3DFEc41b65821CC450C177d7B2131c939cEf2eAD&tokenId=757
    const urlParams = new URLSearchParams(window.location.search);
    const nftTokenAddress = urlParams.get("nftTokenAddress");
    const tokenId = urlParams.get("tokenId");

    // check if nftTokenAddress and tokenId are not null
    if (nftTokenAddress === null || tokenId === null) {
      return;
    }
    // setChoosenNft(data);
    setnftButtonText("Switch NFT");
    setNftAddress(nftTokenAddress as any);
    setTokenId(tokenId as any);
    // get nft info

    // load nft data
    const nftData = await alchemy.nft.getNftMetadata(nftTokenAddress, tokenId);
    setChoosenNft(nftData);
  }

  async function handleCreateGiveaway() {
    // !!! you need to also check if the user has aproved the contract to transfer the nft
    // check that all attributes are filled
    if (account.address === null) {
      setProgramError("Please connect your wallet");
      return;
    }
    if (nftAddress === "") {
      setProgramError("Please enter a valid nft address");
      return;
    }
    if (tokenId === "") {
      setProgramError("Please enter a valid token id");
      return;
    }
    if (selectedDate === null) {
      setProgramError("Please select a valid date");
      return;
    }
    if (selectedUnixTime === 0) {
      setProgramError("Please select a valid date");
      return;
    }
    if (erc20Active && amount === 0) {
      setProgramError("Please enter a valid amount");
      return;
    }
    client?.request;

    const wallet = client;
    setShowDemoModal(true);
    setHashText("");
    try {
      let publicCLient = createPublicClient({
        chain: base,
        transport: http(),
      });

      let tokenIDToUse = tokenId;
      if (erc20Active) {
        var currentDate = new Date();
        // Get the Unix timestamp in seconds
        tokenIDToUse = Math.floor(currentDate.getTime() / 1000).toString();
      }
      console.log("tokenIDTOUSE", tokenIDToUse);

      // Check if a giveaway entry exists for this nft
      const giveaways = await publicCLient.readContract({
        address: "0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa",
        abi: GibiBase.abi,
        functionName: "getUserRaffles",
        args: [account.address],
      });
      // Define the NFT token you want to check
      const nftTokenToCheck = { nftTokenAddress: nftAddress, tokenId: tokenId };
      // Function to check if the NFT token is in the array
      let giveawayExists = false;
      if (!erc20Active) {
        for (let giveaway of giveaways as any[]) {
          if (
            giveaway.nftTokenAddress.toLowerCase() == nftTokenToCheck.nftTokenAddress.toLowerCase() &&
            formatUnits(giveaway.tokenId, 0) == nftTokenToCheck.tokenId &&
            giveaway.ended == false
          ) {
            giveawayExists = true;
            break;
          }
        }
      }

      let aproved = false;
      let amount_to_approve = 0;
      // CHECK FOR approval ERC20
      if (erc20Active) {
        console.log("ERC20 ACTIVE", nftAddress as `0x${string}`);
        console.log(account.address);
        let decimals = (await alchemy.core.getTokenMetadata(nftAddress)) as any;
        amount_to_approve = amount * Math.pow(10, decimals.decimals);
        // !! call the function that reads how much has been aproved
        const allowance = (await publicCLient.readContract({
          address: nftAddress as `0x${string}`,
          abi: BasedCoin.abi,
          functionName: "allowance",
          args: [account.address, "0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa"],
        })) as number;
        console.log("allowance", allowance);
        console.log("it ends heere");
        console.log("amount", amount_to_approve);
        if (allowance >= amount_to_approve) {
          aproved = true;
        }
        console.log("aproved", aproved);
      }
      // NFT APPROVAL BLOCKCHAIN
      else {
        // Check if the user has aproved the contract to transfer the nft
        aproved = (await publicCLient.readContract({
          address: nftAddress as `0x${string}`,
          abi: PixelOpepen.abi,
          functionName: "isApprovedForAll",
          args: [account.address, "0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa"],
        })) as boolean;
      }

      console.log("amount", amount_to_approve);

      // CREATE APPROVAL TRANSACTION
      if (!aproved && !giveawayExists) {
        if (erc20Active) {
          console.log("1111 heere");
          setModalText("Aprove ERC20 in wallet, if transaction is not appearing please retry");
          const hash = await writeContractAsync(
            {
              address: nftAddress as `0x${string}`,
              abi: PixelOpepen.abi,
              functionName: "approve",
              args: ["0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa", amount_to_approve],
            },
            {
              onSuccess: async (hash) => {
                console.log("hash", hash);

                setModalText("Waiting for ERC20 approval to complete ");
                setHashText("transaction hash: \n" + hash);
                for (let tries = 0; tries < 10; tries++) {
                  try {
                    await publicCLient.waitForTransactionReceipt({
                      confirmations: 5,
                      hash: hash as `0x${string}`,
                      timeout: 240_000,
                    });
                    break;
                  } catch (e) {
                    if (tries === 9) {
                      // raise error and pass e
                      throw e;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 4000));
                    continue;
                  }
                }
                setModalText("ERC20 approval completed! approve giveaway transaction in wallet");
                setHashText("transaction hash: \n" + hash);
              },
              onError: (e) => {
                console.log("error", e);
                setShowDemoModal(false);
                setProgramError(e?.toString() as string);
              },
            }
          );
        } else {
          setModalText("Aprove NFT collection in wallet, if transaction is not appearing please retry");
          const hash = await writeContractAsync(
            {
              address: nftAddress as `0x${string}`,
              abi: PixelOpepen.abi,
              functionName: "setApprovalForAll",
              args: ["0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa", true],
            },
            {
              onSuccess: async (hash) => {
                console.log("hash", hash);
                setModalText("Waiting for NFT approval to complete ");
                setHashText("transaction hash: \n" + hash);
                for (let tries = 0; tries < 10; tries++) {
                  try {
                    await publicCLient.waitForTransactionReceipt({
                      confirmations: 5,
                      hash: hash as `0x${string}`,
                      timeout: 240_000,
                    });
                    break;
                  } catch (e) {
                    if (tries === 9) {
                      // raise error and pass e
                      throw e;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 4000));
                    continue;
                  }
                }
                setModalText("NFT approval completed! approve giveaway transaction in wallet");
                setHashText("transaction hash: \n" + hash);
              },
              onError: (e) => {
                console.log("error", e);
                setShowDemoModal(false);
                setProgramError(e?.toString() as string);
              },
            }
          );
          // for (let tries = 0; tries < 10; tries++) {
          //   try {
          //     await publicCLient.waitForTransactionReceipt({
          //       confirmations: 5,
          //       hash: hash as `0x${string}`,
          //       timeout: 240_000,
          //     });
          //     break;
          //   } catch (e) {
          //     if (tries === 9) {
          //       // raise error and pass e
          //       throw e;
          //     }
          //     tries++;
          //     await new Promise((resolve) => setTimeout(resolve, 4000));
          //     continue;
          //   }
          // }
          //
        }
      } else {
        if (giveawayExists) {
          setModalText("Giveaway already created in blockchain, creating giveaway in database");
        } else {
          setModalText("Aprove giveaway creation transaction in wallet");
        }
      }
      // CREATE GIVEAWAY IN BLOCKCHAIN
      if (!giveawayExists) {
        console.log("2222");
        console.log(amount_to_approve.toString());
        const hash2 = await writeContractAsync(
          {
            address: "0xb27b8faA75aF44730bF89Ea603e6C367B7CE4BFa",
            abi: GibiBase.abi,
            functionName: "createRaffle",
            args: [nftAddress, tokenIDToUse, isERC1155, erc20Active, amount_to_approve, amount_to_approve],
          },
          {
            onSuccess: async (hash) => {
              console.log("hash", hash);

              setModalText("Waiting for giveaway creation to complete");
              setHashText("Giveaway creation transaction hash: \n" + hash);
              for (let tries = 0; tries < 10; tries++) {
                try {
                  await publicCLient.waitForTransactionReceipt({
                    confirmations: 5,
                    hash: hash as `0x${string}`,
                    timeout: 240_000,
                  });
                  break;
                } catch (e) {
                  if (tries === 9) {
                    // raise error and pass e
                    throw e;
                  }
                  await new Promise((resolve) => setTimeout(resolve, 4000));
                  continue;
                }
              }
              setModalText("Giveaway created in blockchain! now creating in database");
            },
            onError: (e) => {
              console.log("error", e);
              setShowDemoModal(false);
              setProgramError(e?.toString() as string);
            },
          }
        );

        console.log("3333");
        console.log("hash2", hash2);
        console.log("3333");
        //
        // });
      }

      // CREATE GIVEAWAY IN DATABASE
      const storedSignature = localStorage.getItem("signature" + account.address);
      const storedMessage = localStorage.getItem("message" + account.address);
      const giveawayType = erc20Active ? "ERC-20" : "NFT";
      let giveaway_prize = choosenNft.rawMetadata.name;

      if (erc20Active) {
        giveaway_prize = amount + " " + choosenNft.rawMetadata.name;
      }
      console.log("Giveaway prize is: ", giveaway_prize);

      await fetch(process.env.NEXT_PUBLIC_CREATE_GIVEAWAY_URL as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nft_contract_Address: nftAddress,
          giveaway_creator_address: account.address,
          nft_token_id: tokenIDToUse,
          giveaway_name: "N/A",
          end_date: selectedUnixTime,
          discord_guild_id: discordGuildID,
          discord_guild_name: discordServerName,
          prize: giveaway_prize,
          x_signature: storedSignature,
          x_message: storedMessage,
          is_ERC1155: isERC1155,
          giveaway_type: giveawayType,
          amount: amount,
          image_link: choosenNft.media[0].gateway,
        }),
      }).then(async (response) => {
        // Handle the response !!! haven't handle it correctly yet
        if (response.ok) {
          // read response it should contain the giveaway id
          const data = await response.json();
          router.push(`/participate_giveaway?giveaway_id=${data.giveaway_id}`);
        } else {
          // Error
          console.log("Failed to create giveaway");
          const prev_text = "Giveaway creation failed in our database please retry, no blockchain transaction needed \n";
          const error_message = prev_text + (await response.text());
          setModalText(error_message);
          setHashText("");
          setProgramError(error_message);
        }
      });
    } catch (e) {
      // ERROR STATE
      // AQUI MEJOR CIERRA EL MODAL Y MUESTRA EL ERROR
      console.log("error", e);
      setModalText(e?.toString() as string);
      setProgramError(e?.toString() as string);
    }
  }

  const handleCloseAndSave = (data: any) => {
    console.log("we got heeere!!");
    console.log(data);
    console.log(data.media[0].gateway);
    setChoosenNft(data);
    setnftButtonText("Switch NFT");
    setNftAddress(data.contract.address);
    setErc20Active(false);
    if (data["tokenType"] === "ERC1155") {
      setIsERC1155(true);
    } else if (data["erc20Active"] === true) {
      setErc20Active(true);
    } else {
      setIsERC1155(false);
    }
    setTokenId(data.tokenId);
  };

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
          }}>
          <Image src="/creategibi1.png" alt="GIBI Logo" width={1000} height={200} />
          <div className=" items-center justify-center md:flex md:items-center mb-6">
            <div className=" items-center justify-center md:w-2/3">
              <label className="text-gray-500 font-bold mb-1 pr-4">Giveaway End Date</label>
              <div className="md:w-2/3">
                <Flatpickr
                  className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                  ref={fp}
                  onChange={(selectedDates) => {
                    if (selectedDates.length > 0) {
                      const newSelectedDate = selectedDates[0] as any;
                      setSelectedDate(newSelectedDate);
                      // Convert the selected date to UTC and Unix time formats
                      const utcTime = newSelectedDate.toISOString();
                      const unixTime = Math.floor(newSelectedDate.getTime() / 1000);
                      setSelectedUnixTime(unixTime);
                    }
                  }}
                  options={{
                    enableTime: true,
                    dateFormat: "Y-m-d H:i:S",
                    minDate: new Date(),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              className="py-3 px-4 uppercase text-xs font-bold cursor-pointer tracking-wider text-pink-500 border-pink-500 border-2 hover:bg-pink-500 hover:text-white transition ease-out duration-700"
              onClick={() => setShowNftModal(true)}>
              + {nftButtonText} +
            </button>
            <label className="text-gray-500 font-bold mb-1 pr-4 pl-1.5">or</label>
            <button
              className="py-3 px-4 uppercase text-xs font-bold cursor-pointer tracking-wider text-pink-500 border-pink-500 border-2 hover:bg-pink-500 hover:text-white transition ease-out duration-700"
              onClick={() => setShowERC20Modal(true)}>
              + Attach ERC20 +
            </button>
            {choosenNft && (
              <div>
                <label className="text-gray-500 font-bold mb-1 pr-4">{choosenNft.rawMetadata.name}</label>
                <img className="rounded-xl shadow-md dark:shadow-gray-800" src={choosenNft.media[0].gateway} alt="Image" width={300} height={300} />
              </div>
            )}
            {erc20Active && (
              <div className=" items-center justify-center md:flex md:items-center mb-6">
                <div className=" items-center justify-center md:w-2/3">
                  <p className="text-gray-500 font-bold mb-1 pr-4">Amount</p>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                      id="nft_id"
                      placeholder="0.00"
                      onChange={(e) => {
                        setAmount(parseInt(e.target.value));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <button
                type="submit"
                onClick={handleCreateGiveaway}
                className="text-bold group flex max-w-fit items-center justify-center space-x-2 rounded-full bg-slate-500 px-6 py-2 text-lg font-bold text-white transition-colors mt-5">
                Create Giveaway
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <h1 className="text-red-500 items-center">{programError}</h1>
          </div>
        </form>
        {NftModal && <NftModal onCloseAndSave={handleCloseAndSave} />}
        {ERC20Modal && <ERC20Modal onCloseAndSave={handleCloseAndSave} />}
        <DemoModal />
      </div>
    </>
  );
}
