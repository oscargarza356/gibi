"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useChains } from "wagmi";
import GibiStorage from "../../contracts/GibiStorage.json";
import { parse } from "path";
import Image from "next/image";
import { createPublicClient, http, formatUnits } from "viem";
import { base, polygon } from 'viem/chains'
export default function UserGibis() {
  // call backend to get user gibis
  const account = useAccount();
  interface Product {
    id: string;
    link: string;
    prize: string;
    name: string;
    end_date: string;
    winner: string;
    status: string;
    openseaLink: string;
  }
  const chains = useChains();

  const productsType: Product[] = [
    // ... your product data
  ];

  const [products, setProducts] = useState(productsType);

  // async get user gibis
  useEffect(() => {
    getUserGIBIS();
  }, []);

  // this retries the giveawy
  // does this serve any purpose???
  async function retryGiveaway(giveaway_id: string) {
    const storedSignature = localStorage.getItem("signature" + account.address);
    const storedMessage = localStorage.getItem("message" + account.address);
    const response = await fetch(process.env.NEXT_PUBLIC_RETRY_GIVEAWAY_URL as any, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        giveaway_id: "107",
        x_signature: storedSignature,
        x_message: storedMessage,
      }),
    });
    const data = await response.json();
    console.log(data);
    if (data.status == "success") {
      alert("success");
    } else {
      alert("failed");
    }
  }
  async function getUserGIBIS() {
    const storedSignature = localStorage.getItem("signature" + account.address);
    const storedMessage = localStorage.getItem("message" + account.address);
    const url = (process.env.NEXT_PUBLIC_GET_USER_GIBIS_URL as any) + "/" + account.address;
    console.log("theee url, ", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ x_signature: storedSignature, x_message: storedMessage }),
    });
    const data = await response.json();
    console.log("como veeergaa da lo otro");
    console.log("sdfasdfasdfasd", data);

    // get gibis in the contract
    let publicCLient = createPublicClient({
      chain: polygon,
      transport: http(),
    });
    const gibis: { ended: boolean; nftTokenAddress: string; tokenId: any }[] = (await publicCLient.readContract({
      address: "0xfBE2fdA5554f08E22cDc36B70290186cb9f74641",
      abi: GibiStorage.abi,
      functionName: "getUserGiveaways",
      args: [account.address],
    })) as { ended: boolean; nftTokenAddress: string; tokenId: any }[];
    // loop through gibis and compare it to data
    let holderArray: any[] = [];
    for (let i = 0; i < gibis.length; i++) {
      if (gibis[i].ended) {
        continue;
      }
      // loop data
      let stuck = true;
      for (let j = 0; j < data.length; j++) {
        if (
          gibis[i].nftTokenAddress.toLowerCase() == data[j].nft_contract_Address.toLowerCase() &&
          BigInt(gibis[i].tokenId) == BigInt(data[j].nft_token_id)
        ) {
          if (data[j].status == "failed") {
            break;
          }
          stuck = false;
          break;
        }
      }
      if (stuck) {
        console.log("hash", "stuck", gibis[i]);
        // append to data {}
        holderArray.push({
          id: "???",
          name: gibis[i].nftTokenAddress,
          nft_contract_Address: gibis[i].nftTokenAddress,
          nft_token_id: gibis[i].tokenId,
          status: "stuck",
          end_date: "N/A",
          prize: "opensealink🔎",
        });
      }
    }
    // push holderArray to data
    for (let i = 0; i < holderArray.length; i++) {
      data.push(holderArray[i]);
    }

    // set a link for each giveaway
    for (let i = 0; i < data.length; i++) {
      data[i].openseaLink = "https://opensea.io/assets/matic/" + data[i].nft_contract_Address + "/" + data[i].nft_token_id;
      if (data[i].status == "stuck") {
        data[i].link = "create_giveaway?nftTokenAddress=" + data[i].nft_contract_Address + "&tokenId=" + data[i].nft_token_id;
        continue;
      } else if (data[i].status == "pending tweet") {
        data[i].link = "update_tweet?giveaway_id=" + data[i].id;
        continue;
      } else if (data[i].status == "draw pending") {
        data[i].link = "draw_winner?giveaway_id=" + data[i].id;
        continue;
      }
      data[i].link = "participate_giveaway?giveaway_id=" + data[i].id;
    }
    setProducts(data.reverse());
    console.log(data);
  }

  return (
    <>
      <Image
        src="/created.png"
        className={`animate-fade-up bg-gradient-to-br to-pink-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm md:text-7xl md:leading-[5rem]`}
        style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
        alt="GIBI Logo"
        width={400}
        height={10}
      />
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Giveaway ID🎁
              </th>
              <th scope="col" className="px-6 py-3">
                Prize⛵
              </th>
              <th scope="col" className="px-6 py-3">
                End Date⏰
              </th>
              <th scope="col" className="px-6 py-3">
                Winner🏆
              </th>
              <th scope="col" className="px-6 py-3">
                Status📊
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  <a href={product.link} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    {product.id}
                  </a>
                </th>
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  <a href={product.openseaLink} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    {product.prize}
                  </a>
                </th>
                <td className="px-6 py-4">{product.end_date}</td>
                <td className="px-6 py-4">{product.winner}</td>
                {product.status == "completed" ? (
                  <td className="px-6 py-4 text-green-300">{product.status}</td>
                ) : product.status == "stuck" ? (
                  <td className="px-6 py-4 text-orange-400">{product.status}</td>
                ) : (
                  <td className="px-6 py-4">{product.status}</td>
                )}

                {product.status == "stuck" ? (
                  <td className="px-6 py-4 text-right">
                    <a href={product.link} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                      Fix
                    </a>
                  </td>
                ) : product.status == "pending tweet" ? (
                  <td className="px-6 py-4 text-right">
                    <a href={product.link} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                      Update
                    </a>
                  </td>
                ) : product.status == "draw pending" ? (
                  <td className="px-6 py-4 text-right">
                    <a href={product.link} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                      Draw
                    </a>
                  </td>
                ) : (
                  <td className="px-6 py-4 text-right">
                    <a href="#" className="font-medium text-blue-600 dark:text-blue-500 hover:underline"></a>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
