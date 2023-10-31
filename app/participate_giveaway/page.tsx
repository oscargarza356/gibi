import ParticipateInGiveaway from "@/components/participategiveaway";
import { Metadata, ResolvingMetadata } from "next";
import { Network, Alchemy } from "alchemy-sdk";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};
// THIS PAGE WORKS AS A SERVER COMPONENT only meant to store metadata in header for twitter cards
export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.id;
  // fetch data
  const getGiveawayUrl = (process.env.NEXT_PUBLIC_GET_GIVEAWAY_URL as string) + searchParams.giveaway_id;
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.MATIC_MAINNET,
  };
  const alchemy = new Alchemy(settings);

  let nftImageUrl = "";
  let floorPrice = 0;
  let nftName = "";
  let participants = 0;
  let decimalFloorPrice = 0;
  console.log("geere");
  await fetch(getGiveawayUrl, {})
    .then((response) => response.json())
    .then(async (data) => {
      console.log(data);
      participants = data.num_of_participants;
      // load floor price
      const url =
        "https://polygon-rest.api.mnemonichq.com/marketplaces/v1beta2/floors/" + data.nft_contract_Address + "?marketplaceId=MARKETPLACE_ID_OPENSEA";
      const headers = {
        "X-API-Key": "887VrswXkXC8bzJKvxnrUF2PIR6c8rV55Uo3gAr5X1ZGuBVz",
        accept: "application/json",
      };
      const responseTest = await fetch(url, {
        method: "GET",
        headers: headers,
      });
      const responseJson = await responseTest.json();
      floorPrice = responseJson.price.totalNative;

      // change floor from string to number
      floorPrice = parseFloat(floorPrice as any);
      floorPrice = floorPrice.toFixed(1) as any;
      console.log("floor price 2: " + decimalFloorPrice);

      console.log("floor price: " + floorPrice);
      // floor price to 1 decimal

      // load nft image
      const response2 = await alchemy.nft.getNftMetadata(data.nft_contract_Address, data.nft_token_id);
      nftName = response2?.rawMetadata?.name as string;

      nftImageUrl = response2?.media[0].gateway as string;
    });
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];
  return {
    twitter: {
      card: "summary_large_image",
      title: "GIBI 🎁 | FP: " + floorPrice.toString() + " MATIC💜 |" + "Entries: " + participants.toString() + "👥",
      description: "GIBI is the ultimate solution to web3 giveaways embracing a more open and just way of running giveaways on the internet.",
      creator: "@MaskedDAO",
      images: [nftImageUrl],
    },
  };
}

export default async function CreateNewGiveaway() {
  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <ParticipateInGiveaway />
      </div>
    </>
  );
}
