"use client";
import Balancer from "react-wrap-balancer";
import Image from "next/image";
import { polygon } from "@wagmi/core/chains";
import { useCreateGIBIModal } from "@/components/home/create-giveaway-modal";
import { SiweMessage } from "siwe";
import { useRouter } from "next/navigation";
import { useCreateSIGNModal } from "@/components/home/sign-modal";
import { useState, useEffect } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import ComponentGrid from "@/components/home/component-grid";
import Card from "@/components/home/card";
import { Network, Alchemy } from "alchemy-sdk";
import { useSwitchChain } from "wagmi";
import BarLoader from "react-spinners/BarLoader";
import { useAccountEffect } from "wagmi";
import { useSignMessage } from "wagmi";
import { useChainId } from "wagmi";
import { useAccount } from "wagmi";

export default function Home() {
  const { DemoModal } = useCreateGIBIModal();
  const { DemoModal: DemoModal2, setShowDemoModal: setShowDemoModal2, setModalText: setModalText2 } = useCreateSIGNModal();
  const [homeSignModal, setHomeSignModal] = useState(false);
  const router = useRouter();
  const connectModal = useConnectModal(); // Assuming useConnectModal() returns an object with openConnectModal property
  const [selectedTab, setSelectedTab] = useState("active");
  const [loadingBar, setLoadingBar] = useState(true);
  const [coneImage, setConeImage] = useState("/CONE1.png");
  const [domain, setDomain] = useState("");
  const [origin, setOrigin] = useState("");
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const account = useAccount();

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
    setDomain(window.location.host);
    setOrigin(window.location.origin);
    getActiveGiveaways();
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    setConeImage("/CONE" + randomImageNumber + ".png");
  }, []);

  useAccountEffect({
    onConnect(data) {
      if (homeSignModal) {
        console.log("heere11");
        checkSignatureAndRedirect();
      }
    },
    onDisconnect() {
      console.log("Disconnected!");
    },
  });

  function createSiweMessage(address: any) {
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

  async function checkSignatureAndRedirect() {
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
      const storedSignature = localStorage.getItem("signature" + account.address);
      const storedMessage = localStorage.getItem("message" + account.address);
      console.log(storedMessage);
      console.log(storedSignature);
      if (!storedSignature || !storedMessage) {
        console.log("here 33");
        const message = createSiweMessage(account.address);
        try {
          let signature = await signMessageAsync({ message: message });
          localStorage.setItem("signature" + account.address, signature);
          localStorage.setItem("message" + account.address, message);
        } catch (e) {
          console.log(e);
        }
      }
      console.log("here 33");
      router.push("/create_giveaway");
    }
  }

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
    console.log("activeGiveaways", activeGiveaways);
    for (let i = 0; i < activeGiveaways.length; i++) {
      activeGiveaways[i].title = activeGiveaways[i].prize;
      const link = "participate_giveaway?giveaway_id=" + activeGiveaways[i].id;
      console.log("imaaagen", activeGiveaways[i].image_link);
      activeGiveaways[i].demo = (
        <a href={link}>
          <Image src={activeGiveaways[i].image_link as string} alt="GIBI" width={340} height={340} unoptimized />
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
      if (endedGiveaways[i].giveaway_type == "ERC-20") {
        endedGiveaways[i].title = endedGiveaways[i].prize;
      } else {
        endedGiveaways[i].title = endedGiveaways[i].prize;
        endedGiveaways[i].openseaLink =
          "https://opensea.io/assets/matic/" + endedGiveaways[i].nft_contract_Address + "/" + endedGiveaways[i].nft_token_id;
      }
      const link = "participate_giveaway?giveaway_id=" + endedGiveaways[i].id;
      endedGiveaways[i].demo = (
        <a href={link}>
          <Image src={endedGiveaways[i].image_link} alt="GIBI" width={340} height={340} unoptimized />
        </a>
      );
      endedGiveaways[i].large = false;
      endedGiveaways[i].description = "endedGiveaways";
    }
    // data first 10 elements
    setProducts(endedGiveaways);
    setLoadingBar(false);
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
              className={`inline-block p-4 border-b-2 ${selectedTab === "active"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-800 dark:text-gray-400 hover:text-gray-600 hover:border-gray-300"
                } rounded-t-lg  `}
              onClick={() => handleTabClick("active")}>
              Active
            </p>
          </li>
          <li className="mr-2">
            <p
              className={`inline-block p-4 border-b-2 ${selectedTab === "ended"
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
      <div className="justify-center mt-4 animate-fade-up items-center  opacity-0" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
        {selectedTab === "active" && activeGiveaways.length === 0 && (
              <p className="text-center text-gray-500">There are no active giveaways.</p>
            )}      
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
