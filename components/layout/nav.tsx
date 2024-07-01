"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useScroll from "@/lib/hooks/use-scroll";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { useRouter } from "next/navigation";
import { useAccountEffect, useSignMessage, useAccount } from "wagmi";
import { useEffect } from "react";

export default function Nav() {
  const scrolled = useScroll(50);
  const [domain, setDomain] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setDomain(window.location.host);
    setOrigin(window.location.origin);
  }, []);
  // const account = getAccount();
  const [connected, setConnected] = useState(false);
  const router = useRouter();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();

  useAccountEffect({
    onConnect(data) {
      setConnected(true);
      console.log("Connected!1", data);
      console.log(data.address);
      console.log("hello?");
    },
    onDisconnect() {
      console.log("Disconnected!");
      setConnected(false);
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

  async function redirectToUserGibis() {
    //
    const storedSignature = localStorage.getItem("signature" + account.address);
    const storedMessage = localStorage.getItem("message" + account.address);
    if (!storedSignature || !storedMessage) {
      const message = createSiweMessage(account.address);
      try {
        let signature = await signMessageAsync({ message: message });
        localStorage.setItem("signature" + account.address, signature);
        localStorage.setItem("message" + account.address, message);
        router.push("/user_gibis");
      } catch (e) {
        console.log(e);
      }
    } else {
      router.push("/user_gibis");
    }
  }

  return (
    <>
      <div
        className={`fixed top-0 w-full flex justify-center ${
          scrolled ? "border-b border-gray-200 bg-white/50 backdrop-blur-xl" : "bg-white/0"
        } z-30 transition-all`}>
        <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between w-full">
          <Link href="/" className="flex items-center font-display text-2xl">
            <Image src="/gibi2.png" alt="Gibi logo" width="130" height="130" className="mr-2 rounded-sm"></Image>
          </Link>
          <div className="flex items-center">
            <ConnectButton />
            {connected ? (
              <button onClick={redirectToUserGibis} className="text-2xl transition duration-500 hover:scale-125 " rel="noopener noreferrer">
                🎁
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
