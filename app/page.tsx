"use client";
import Balancer from "react-wrap-balancer";
import Image from "next/image";
import { connect, getNetwork, switchNetwork, getAccount } from "@wagmi/core";
import { polygon } from "@wagmi/core/chains";
import { InjectedConnector } from "@wagmi/core/connectors/injected";
import { useCreateGIBIModal } from "@/components/home/create-giveaway-modal";
import { signMessage } from "@wagmi/core";
import { SiweMessage } from "siwe";
import { useRouter } from "next/navigation";
import { useCreateSIGNModal } from "@/components/home/sign-modal";
import { use, useState, useEffect } from "react";
import { watchAccount } from "@wagmi/core";
import { useConnectModal, useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";
import ComponentGrid from "@/components/home/component-grid";
import Card from "@/components/home/card";
import { Network, Alchemy } from "alchemy-sdk";
import test from "node:test";
import BarLoader from "react-spinners/BarLoader";

export default function Home() {
  const { DemoModal, setShowDemoModal, setModalText, setHashText } = useCreateGIBIModal();
  const { DemoModal: DemoModal2, setShowDemoModal: setShowDemoModal2, setModalText: setModalText2 } = useCreateSIGNModal();
  const [homeSignModal, setHomeSignModal] = useState(false);
  const domain = window.location.host;
  const origin = window.location.origin;
  const router = useRouter();
  const connectModal = useConnectModal(); // Assuming useConnectModal() returns an object with openConnectModal property
  const [selectedTab, setSelectedTab] = useState("active");
  const [loadingBar, setLoadingBar] = useState(true);
  const [coneImage, setConeImage] = useState("/CONE1.png");

  interface Product {
    title: string;
    description: string;
    demo: string;
    large: boolean;
    end_date: Date;
    openseaLink: string;
  }
  const productsType: Product[] = [
    // ... your product data
  ];

  const [endedGiveaways, setProducts] = useState(productsType);
  const [activeGiveaways, setActiveGiveaways] = useState(productsType);
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.MATIC_MAINNET,
  };

  const alchemy = new Alchemy(settings);

  useEffect(() => {
    getActiveGiveaways();
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    setConeImage("/CONE" + randomImageNumber + ".png");
  }, []);

  async function getActiveGiveaways() {
    const urlActive = process.env.NEXT_PUBLIC_GET_ACTIVE_GIVEAWAYS as string;
    const responseActive = await fetch(urlActive, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const dataActive = await responseActive.json();
    let activeGiveaways = dataActive.reverse().slice(0, 20);
    for (let i = 0; i < activeGiveaways.length; i++) {
      const response2 = await alchemy.nft.getNftMetadata(activeGiveaways[i].nft_contract_Address, activeGiveaways[i].nft_token_id);
      activeGiveaways[i].title = response2?.rawMetadata?.name;
      const link = "participate_giveaway?giveaway_id=" + activeGiveaways[i].id;
      activeGiveaways[i].demo = (
        <a href={link}>
          <Image src={response2?.media[0].gateway as string} alt="GIBI" width={340} height={340} unoptimized />
        </a>
      );
      console.log("activeGiveaways[i].end_date", activeGiveaways[i].end_date);
      activeGiveaways[i].large = false;
      activeGiveaways[i].description = "activeGiveaways";
      activeGiveaways[i].openseaLink =
        "https://opensea.io/assets/matic/" + activeGiveaways[i].nft_contract_Address + "/" + activeGiveaways[i].nft_token_id;
    }
    setActiveGiveaways(activeGiveaways);

    const url = process.env.NEXT_PUBLIC_GET_COMPLETED_GIVEAWAYS as string;
    console.log("theee url, ", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    let endedGiveaways = data.reverse().slice(0, 20);
    console.log("endedGiveaways", endedGiveaways);
    // loop through data and get image url
    for (let i = 0; i < endedGiveaways.length; i++) {
      const response2 = await alchemy.nft.getNftMetadata(endedGiveaways[i].nft_contract_Address, endedGiveaways[i].nft_token_id);
      endedGiveaways[i].title = response2?.rawMetadata?.name;
      const link = "participate_giveaway?giveaway_id=" + endedGiveaways[i].id;
      console.log(response2?.media[0].gateway);
      endedGiveaways[i].demo = (
        <a href={link}>
          <Image src={response2?.media[0].gateway as string} alt="GIBI" width={340} height={340} unoptimized />
        </a>
      );
      endedGiveaways[i].large = false;
      endedGiveaways[i].description = "endedGiveaways";
      endedGiveaways[i].openseaLink =
        "https://opensea.io/assets/matic/" + endedGiveaways[i].nft_contract_Address + "/" + endedGiveaways[i].nft_token_id;
    }
    // data first 10 elements
    setProducts(endedGiveaways);

    setLoadingBar(false);
  }

  const unwatch = watchAccount((account) => {
    if (account.isConnected) {
      if (homeSignModal) {
        setHomeSignModal(false);
        checkSignatureAndRedirect();
      }
    }
  });

  function createSiweMessage() {
    const { chain, chains } = getNetwork();
    const account = getAccount();
    const message = new SiweMessage({
      domain,
      address: account.address,
      statement: "test",
      uri: origin,
      version: "1",
      chainId: 1,
    });
    return message.prepareMessage();
  }

  async function checkSignatureAndRedirect() {
    const { chain, chains } = getNetwork();
    const account = getAccount();
    if (!account.isConnected) {
      console.log("here 22");
      // setShowDemoModal2(true);
      setHomeSignModal(true);
      if (connectModal.openConnectModal) {
        connectModal.openConnectModal();
      } else {
        console.log("ERROR connectModal.openConnectModal is null");
      }
    } else {
      console.log("heeere111");
      if (chain?.id !== polygon.id) {
        const network = await switchNetwork({
          chainId: polygon.id,
        });
      }
      const storedSignature = localStorage.getItem("signature" + account.address);
      const storedMessage = localStorage.getItem("message" + account.address);
      if (!storedSignature || !storedMessage) {
        setModalText("Please Verify Your account by signing the message in your wallet.");
        setShowDemoModal(true);
        const message = createSiweMessage();
        const signature = await signMessage({
          message: message,
        });
        localStorage.setItem("signature" + account.address, signature);
        localStorage.setItem("message" + account.address, message);
      }
      router.push("/create_giveaway");
    }
  }

  const handleTabClick = (tab: "active" | "ended") => {
    setSelectedTab(tab);
  };

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <Image
          src="/homegibi.png"
          className={`animate-fade-up bg-gradient-to-br to-pink-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm md:text-7xl md:leading-[5rem]`}
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
          alt="GIBI Logo"
          width={1000}
          height={10}
        />
        <p
          className="mt-4 animate-fade-up text-center text-gray-500 opacity-0 md:text-xl"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
          <Balancer>Easily create secure and fair web3 giveaways with GIBI.</Balancer>
        </p>
        <div
          className="mx-auto flex animate-fade-up items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
          <div className="mx-auto mt-6 flex justify-center items-center" onClick={checkSignatureAndRedirect}>
            <button className="text-bold rounded-full bg-pink-400 px-6 py-2 font-bold text-white transition-colors">CREATE GIBI</button>
          </div>
        </div>
        <DemoModal />
        <DemoModal2 />
      </div>
      <Balancer className="px-5 xl:px-0">
        <Image
          src={coneImage}
          className={`animate-fade-up bg-gradient-to-br to-pink-500 mt-6 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm md:text-7xl md:leading-[5rem]  rounded-xl`}
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
          alt="GIBI Logo"
          width={600}
          height={100}
        />
      </Balancer>

      <div
        className="text-sm font-medium text-center text-gray-800 dark:text-gray-400 flex animate-fade-up items-center justify-center space-x-5 opacity-0 mt-6"
        style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <p
              className={`inline-block p-4 border-b-2 ${
                selectedTab === "active"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-800 dark:text-gray-400 hover:text-gray-600 hover:border-gray-300"
              } rounded-t-lg  `}
              onClick={() => handleTabClick("active")}>
              Active
            </p>
          </li>
          <li className="mr-2">
            <p
              className={`inline-block p-4 border-b-2 ${
                selectedTab === "ended"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-800 dark:text-gray-400 hover:text-gray-600 hover:border-gray-300"
              } rounded-t-lg  `}
              onClick={() => handleTabClick("ended")}>
              Ended
            </p>
          </li>
        </ul>
      </div>
      <div className="justify-center mt-4 animate-fade-up items-center  opacity-0" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
        <BarLoader loading={loadingBar} aria-label="Loading Spinner" data-testid="loader" color="green" />
      </div>
      <div className="my-2 grid w-full max-w-screen-lg animate-fade-up grid-cols-2 gap-5 px-5 md:grid-cols-4 xl:px-0">
        {selectedTab == "active"
          ? activeGiveaways.map((product, index) => (
              <Card
                key={index}
                title={product.title}
                description={product.description}
                demo={product.title === "Beautiful, reusable components" ? <ComponentGrid /> : product.demo}
                large={product.large}
                countDownDate={product.end_date}
                openseaLink={product.openseaLink}
              />
            ))
          : endedGiveaways.map((product, index) => (
              <Card
                key={index}
                title={product.title}
                description={product.description}
                demo={product.title === "Beautiful, reusable components" ? <ComponentGrid /> : product.demo}
                large={product.large}
                countDownDate={product.end_date}
              />
            ))}
      </div>
    </>
  );
}

const features = [
  {
    title: "One-click Deploy",
    description: "Jumpstart your next project by deploying Precedent to [Vercel](https://vercel.com/) in one click.",
    demo: (
      <a href="#">
        <Image src="https://vercel.com/button" alt="Deploy with Vercel" width={120} height={30} unoptimized />
      </a>
    ),
    large: false,
  },
  {
    title: "One-click Deploy",
    description: "Jumpstart your next project by deploying Precedent to [Vercel](https://vercel.com/) in one click.",
    demo: (
      <a href="#">
        <Image src="https://vercel.com/button" alt="Deploy with Vercel" width={120} height={30} unoptimized />
      </a>
    ),
    large: false,
  },
  {
    title: "One-click Deploy",
    description: "Jumpstart your next project by deploying Precedent to [Vercel](https://vercel.com/) in one click.",
    demo: (
      <a href="#">
        <Image src="https://vercel.com/button" alt="Deploy with Vercel" width={120} height={30} unoptimized />
      </a>
    ),
    large: false,
  },
  {
    title: "One-click Deploy",
    description: "Jumpstart your next project by deploying Precedent to [Vercel](https://vercel.com/) in one click.",
    demo: (
      <a href="#">
        <Image src="https://vercel.com/button" alt="Deploy with Vercel" width={120} height={30} unoptimized />
      </a>
    ),
    large: false,
  },
];
