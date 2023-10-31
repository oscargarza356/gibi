"use client";
import { useRouter } from "next/navigation";

export default function SocialLogin() {
  const router = useRouter();
  //check if there is access token is in storage
  let discordToken = localStorage.getItem("discordToken");
  console.log("discordToken1", discordToken);
  // check if there is an access token in the url
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  if (urlParams.has("access_token")) {
    console.log("not here yet");
    discordToken = urlParams.get("access_token");
    const giveawayId = urlParams.get("state");
    console.log("discordToken", discordToken);
    // save the token in storage and remove from url
    localStorage.setItem("discordToken", discordToken as string);
    // save expiration
    let expiration = parseInt(urlParams.get("expires_in") as string);
    // Set token expiration time to 7200 seconds (2 hours) later
    const expirationTimeUTC = new Date(Date.now() + expiration * 1000).toISOString();
    localStorage.setItem("discordTokenExpiration", expirationTimeUTC);
    router.push("/participate_giveaway" + "?giveaway_id=" + giveawayId);
  }

  const urlSocialParam = new URLSearchParams(window.location.search);
  const giveawayId = urlSocialParam.get("giveaway_id");
  if (urlSocialParam.get("code")) {
    const twitterToken = urlSocialParam.get("code");
    // call backend to get token
    getTwitterToken(twitterToken, giveawayId);
  }

  async function getTwitterToken(twitterToken: any, giveawayId: any) {
    // get giveaway id from url /social_login?giveaway_id=10
    console.log("giveawayId", giveawayId);
    console.log("twitterToken 111", twitterToken);

    // add giveaway_id to fetch call next to twitterauthurl
    await fetch(process.env.NEXT_PUBLIC_BACK_TWITTERAUTH_URL + giveawayId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: twitterToken,
      },
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
        console.log("error", error);
        const expirationTimeUTC = localStorage.getItem("twitterTokenExpiration");
        if (expirationTimeUTC) {
          const expirationTime = Date.parse(expirationTimeUTC);
          if (Date.now() < expirationTime) {
            // token is still valid
            return;
          } else {
            // token expired
            localStorage.removeItem("twitterToken");
            localStorage.removeItem("twitterTokenExpiration");
            localStorage.removeItem("twitterUsername");
            return;
          }
        }
      } else {
        const data = await response.json();
        console.log("Twitter data", data);
        // save info
        const expirationTimeUTC = new Date(Date.now() + data.expiration * 1000).toISOString();
        localStorage.setItem("twitterTokenExpiration", expirationTimeUTC);
        localStorage.setItem("twitterToken", data.twitter_user_token);
        localStorage.setItem("twitterUsername", data.twitter_username);
        console.log("twitterToken", localStorage.getItem("twitterToken"));
        console.log("twitterUsername", localStorage.getItem("twitterUsername"));
        console.log("twitterTokenExpiration", localStorage.getItem("twitterTokenExpiration"));

        // read http://localhost:3000/social_login?giveaway_id=10 giveaway id from url
        const urlParams = new URLSearchParams(window.location.search);
        console.log("giveawayId", giveawayId);
        router.push("/participate_giveaway" + "?giveaway_id=" + giveawayId);
      }
    });
  }
}
