"use client";
import { useRouter } from "next/navigation";
import { useAccountEffect } from "wagmi";

export default function SocialLogin() {
  const router = useRouter();
  // check if there is an access token in the url
  useAccountEffect({
    onConnect(data) {
      console.log("hello?");
      console.log("aren't we here?");
      console.log("address", data.address);
      const urlSocialParam = new URLSearchParams(window.location.search);
      console.log("urlSocialParam", urlSocialParam);
      if (urlSocialParam.get("code")) {
        const token = urlSocialParam.get("code");
        let giveawayId = urlSocialParam.get("state");
        if (giveawayId?.substring(0, 2) === "**") {
          console.log("discordToken FUNCTIOn!!", token);
          // pass the giveaway id without the ** to the function
          giveawayId = giveawayId.substring(2);
          console.log("giveawayId", giveawayId);
          getDiscordToken(token, giveawayId, data.address);
        } else {
          console.log("twitterToken FUNCTIOn!!", token);
          const giveaway_id = urlSocialParam.get("giveaway_id");
          getTwitterToken(token, giveaway_id, data.address);
        }
      }
    },
    onDisconnect() {
      console.log("Disconnected!");
    },
  });

  // Discord social
  async function getDiscordToken(discordToken: any, giveawayId: any, address: any) {
    console.log("discordToken", discordToken);

    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);
    // call backend
    await fetch(process.env.NEXT_PUBLIC_BACK_DISCORDAUTH_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: discordToken,
      },
      body: JSON.stringify({
        giveaway_id: giveawayId,
        wallet_address: address,
        x_signature: storedSignature,
        x_message: storedMessage,
      }),
    }).then(async (response) => {
      console.log("response", response);
      if (!response.ok) {
        console.log("!!!error", await response.json());
      } else {
        console.log("response", await response.json());
        router.push("/participate_giveaway" + "?giveaway_id=" + giveawayId);
      }
    });
  }

  // Twitter social
  async function getTwitterToken(twitterToken: any, giveawayId: any, address: any) {
    // get giveaway id from url /social_login?giveaway_id=10
    console.log("giveawayId", giveawayId);
    console.log("twitterToken 111", twitterToken);
    const storedSignature = localStorage.getItem("signature" + address);
    const storedMessage = localStorage.getItem("message" + address);
    // add giveaway_id to fetch call next to twitterauthurl
    await fetch(process.env.NEXT_PUBLIC_BACK_TWITTERAUTH_URL + giveawayId, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: twitterToken,
      },
      body: JSON.stringify({
        wallet_address: address,
        x_signature: storedSignature,
        x_message: storedMessage,
        call_local: false,
      }),
    }).then(async (response) => {
      console.log("response", response);
      console.log("response.ok", response.ok);
      console.log("response.status", response.status);
      if (!response.ok) {
        console.log("!!!error", await response.json());
      } else {
        const data = await response.json();
        console.log("data", data);
        router.push("/participate_giveaway" + "?giveaway_id=" + giveawayId);
      }
    });
  }
}
