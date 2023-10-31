"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useScroll from "@/lib/hooks/use-scroll";
import { useSignInModal } from "./sign-in-modal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signMessage } from "@wagmi/core";
import { SiweMessage } from "siwe";
import { getAccount } from "@wagmi/core";
import { watchAccount } from "@wagmi/core";
import { useRouter } from "next/navigation";
export default function NavBar() {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const scrolled = useScroll(50);
  const domain = window.location.host;
  const origin = window.location.origin;
  const account = getAccount();
  const [connected, setConnected] = useState(false);
  const router = useRouter();
  const unwatch = watchAccount((account) => {
    if (account.isConnected) {
      setConnected(true);
    }
    if (!account.isConnected) {
      setConnected(false);
    }
  });

  function createSiweMessage() {
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
  async function testSignature() {
    // get signature and message from local storage
    const storedSignature = localStorage.getItem("signature" + account.address);
    const storedMessage = localStorage.getItem("message" + account.address);
    if (!storedSignature || !storedMessage) {
      const message = createSiweMessage();
      const signature = await signMessage({
        message: message,
      });
      localStorage.setItem("signature" + account.address, signature);
      localStorage.setItem("message" + account.address, message);
    }
    // redirect user to user_gibis page
    router.push("/user_gibis");
  }

  return (
    <>
      <SignInModal />
      <div
        className={`fixed top-0 w-full flex justify-center ${
          scrolled ? "border-b border-gray-200 bg-white/50 backdrop-blur-xl" : "bg-white/0"
        } z-30 transition-all`}>
        <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between w-full">
          <Link href="/" className="flex items-center font-display text-2xl">
            <Image src="/gibi2.png" alt="Gibi logo" width="130" height="130" className="mr-2 rounded-sm"></Image>
          </Link>
          {/* <button
            className="rounded-full border border-black bg-black p-1.5 px-4 text-sm text-white transition-all hover:bg-white hover:text-black"
          >
            Sign In
          </button> */}
          <div className="flex items-center">
            <ConnectButton />
            {connected ? (
              <button onClick={testSignature} className="text-2xl transition duration-500 hover:scale-125 " rel="noopener noreferrer">
                🎁
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
