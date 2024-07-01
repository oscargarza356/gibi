import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Alchemy, Network, NftFilter, NftFilters, NftOrdering } from "alchemy-sdk";
import { getAccount } from "@wagmi/core";
import { useEffect } from "react";
import BarLoader from "react-spinners/BarLoader";
import { useAccount } from "wagmi";
import { useChainId } from 'wagmi'

type ERC20ModalProps = {
  showERC20Modal: boolean;
  setShowERC20Modal: Dispatch<SetStateAction<boolean>>;
  onCloseAndSave: (data: any) => void;
};

const ERC20Modal = ({ showERC20Modal, setShowERC20Modal, onCloseAndSave }: ERC20ModalProps) => {
  const [loadingBar, setLoadingBar] = useState(true);
  const [searching, setSearching] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const account = useAccount();
  const chainId = useChainId()
  interface NFTListType {
    name: any;
    image: any;
  }
  const listType: NFTListType[] = [
    // ... your product data
  ];
  const [nftList, setNftList] = useState(listType);
  const clickPoint = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    if (clickPoint.current) {
      clickPoint.current.style.display = "none";
    }
  };

  const handleBlur = () => {
    if (clickPoint.current) {
      clickPoint.current.style.display = "block";
    }
  };

  const handleSelect = (nft: any) => {
    console.log("nft", nft.name);
    nft.rawMetadata = {};
    nft.rawMetadata.name = nft.name;
    nft.media = [];
    nft.contract = {};
    nft.contract.address = nft.address;
    nft.media.push({ gateway: nft.image });
    nft.tokenId = "0";
    nft.erc20Active = true;
    onCloseAndSave(nft);
    setShowERC20Modal(false);
  };

  useEffect(() => {
    getERC20();
  }, []);

  async function getERC20() {
    console.log("chain id", chainId)
    let chainNetwork = Network.MATIC_MAINNET;
    if (chainId === 8453) {
      console.log("chain sdafsadfaid", chainId)
      chainNetwork = Network.BASE_MAINNET;
    }

    const settings = {
      apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
      network: chainNetwork
    };
    const alchemy = new Alchemy(settings);
    // Wallet address
    const address = account.address as string;
    let nftList: any = [];
    // Get all NFTs --------------------------------------------------------------
    let pageKey = "1";

    const transferTime = "transferTime";
    const nft = await alchemy.core.getTokenBalances(address);
    pageKey = nft["pageKey"] as string;
    // loop each token balance and print the token name
    // !!! le puede faltar pagination...
    console.log("nft", nft);
    let tokensAceptables: Record<string, any> = {
      "0x162539172b53e9a93b7d98fb6c41682de558a320": {
        name: "$GONE",
        image: "https://itsgone.xyz/assets/img/gone_head_2.png",
        address: "0x162539172b53e9a93b7d98fb6c41682de558a320",
      },
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": {
        name: "$USDC",
        image: "https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png",
        address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      },
      "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39": {
        name: "$LINK",
        image: "https://pbs.twimg.com/profile_images/1030475757892579334/qvSHhRyC_400x400.jpg",
        address: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
      },
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": {
        name: "$WETH",
        image: "https://pbs.twimg.com/profile_images/1627642622645878784/TP1GH9TM_400x400.jpg",
        address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      },
      "0xba777ae3a3c91fcd83ef85bfe65410592bdd0f7c": {
        name: "$CONE",
        image: "https://pbs.twimg.com/profile_images/1664847716122230785/_JDPAoAO_400x400.png",
        address: "0xba777ae3a3c91fcd83ef85bfe65410592bdd0f7c",
      },
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": {
        name: "Tether USDt",
        image: "https://pbs.twimg.com/profile_images/1663940523416244225/VdbZXsu7_400x400.jpg",
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      },
      "0x04B48c9707fE5091Ee772d92941F745BC0AD2b8F": {
        name: "$DADS",
        image: "https://pbs.twimg.com/profile_images/1746007764470779904/NrUNO6SO_400x400.jpg",
        address: "0x04B48c9707fE5091Ee772d92941F745BC0AD2b8F",
      },
      "0xed3d18f841d82604f729464835c739a331f1e49b": {
        name: "$DRAGON",
        image: "https://pbs.twimg.com/media/GGHTQSraoAAg0dd?format=jpg&name=small",
        address: "0xed3d18f841d82604f729464835c739a331f1e49b",
      },
      "0x07d15798a67253d76cea61f0ea6f57aedc59dffb": {
        name: "$BASED",
        image: "https://pbs.twimg.com/profile_images/1770219048795504641/sNBeMdJ__400x400.jpg",
        address: "0x07d15798a67253d76cea61f0ea6f57aedc59dffb",
      },
    };
    for (let i = 0; i < nft["tokenBalances"].length; i++) {
      if (nft["tokenBalances"][i]["contractAddress"] == "0x07d15798a67253d76cea61f0ea6f57aedc59dffb") {
        console.log("tokenBalances", nft["tokenBalances"][i]);
      }
      let tokenAddress = nft["tokenBalances"][i]["contractAddress"];
      if (tokensAceptables.hasOwnProperty(tokenAddress)) {
        nftList.push(tokensAceptables[tokenAddress] as NFTListType);
      }
      // await alchemy.core.getTokenMetadata(nft["tokenBalances"][i]["contractAddress"]).then((tokenMetadata) => {
      //   if (tokenMetadata["logo"] != null) {
      //     nftList.push({
      //       name: tokenMetadata["name"],
      //       image: tokenMetadata["logo"],
      //       address: nft["tokenBalances"][i]["contractAddress"],
      //     });
      //   }
      // });
    }
    // only the first 10 elements
    setLoadingBar(false);
    setNftList(nftList);
  }

  return (
    <Modal showModal={showERC20Modal} setShowModal={setShowERC20Modal}>
      <div className="bg-white rounded-xl border-solid border-2 border-white-500 max-h-[90%] overflow-auto">
        <div className="flex flex-wrap items-center justify-center space-y-3 px-4 py-6 pt-8 text-center md:px-16">
          <a href="https://gibi.app">
            <Image src="/gibi2.png" alt="GIBI Logo" width={100} height={100} />
          </a>
          <div className="items-center px-4 flex justify-center">
            <div className="relative mr-3">
              <div className="absolute top-3 left-3 items-center" ref={clickPoint}>
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clip-rule="evenodd"></path>
                </svg>
              </div>
              <input
                type="text"
                className="block p-2 pl-10 w-70 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:pl-3"
                placeholder="Search Here..."
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={(e) => {
                  setSearching(e.target.value);
                }}
              />
              <br />
              <BarLoader loading={loadingBar} aria-label="Loading Spinner" data-testid="loader" color="green" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-5 mx-5 mb-5">
          {/* Add the images to the form */}
          {nftList
            .filter((nft) => {
              if (searching === "") {
                return nft.name;
              } else if (String(nft.name).toLowerCase().includes(searching.toLowerCase())) {
                return nft.name;
              }
            })
            .map((nft, index) => (
              <div key={index} className="h-auto max-w-full rounded-lg items-center justify-center text-center mb-4 mr-5 ml-5 ">
                <p className="font-mono font-bold">{nft.name}</p>
                <div
                  className="relative group cursor-pointer justify-center"
                  onClick={() => {
                    handleSelect(nft);
                    setShowERC20Modal(false);
                  }}>
                  <Image
                    className="rounded-full shadow-md dark:shadow-gray-800 items-center justify-center"
                    key={index}
                    src={nft.image}
                    alt="Image"
                    width={150}
                    height={150}
                  />
                  <div className="hidden lg:block opacity-0 group-hover:opacity-100 duration-300 absolute inset-x-0 bottom-0 flex justify-center items-end text-xl bg-blue-200 text-black font-semibold">
                    SELECT
                  </div>
                </div>
                <button
                  className="lg:hidden bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-3 -ml-4"
                  onClick={() => {
                    handleSelect(nft);
                    setShowERC20Modal(false);
                  }}>
                  SELECT
                </button>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};
export function useERC20Modal() {
  const [showERC20Modal, setShowERC20Modal] = useState(false);

  const ERC20ModalCallback = useCallback(
    ({ onCloseAndSave }: { onCloseAndSave: (data: any) => void }) => {
      return <ERC20Modal showERC20Modal={showERC20Modal} setShowERC20Modal={setShowERC20Modal} onCloseAndSave={onCloseAndSave} />;
    },
    [showERC20Modal, setShowERC20Modal]
  );

  return useMemo(() => ({ setShowERC20Modal, ERC20Modal: ERC20ModalCallback }), [setShowERC20Modal, ERC20ModalCallback]);
}
