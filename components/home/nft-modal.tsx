import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { Alchemy, Network, NftFilter, NftFilters, NftOrdering } from "alchemy-sdk";
import { getAccount } from "@wagmi/core";
import { useEffect } from "react";
import BarLoader from "react-spinners/BarLoader";
type NftModalProps = {
  showNftModal: boolean;
  setShowNftModal: Dispatch<SetStateAction<boolean>>;
  onCloseAndSave: (data: any) => void;
};

const NftModal = ({ showNftModal, setShowNftModal, onCloseAndSave }: NftModalProps) => {
  const [loadingBar, setLoadingBar] = useState(true);
  const [searching, setSearching] = useState("");
  const [searchValue, setSearchValue] = useState("");
  interface NFTListType {
    rawMetadata: any;
    media: any;
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
    onCloseAndSave(nft);
    setShowNftModal(false);
  };
  const settings = {
    apiKey: "yCMOneYzyO2mxAj0tgxSxSQD8ONiMJIZ",
    network: Network.MATIC_MAINNET,
  };

  useEffect(() => {
    getNFTs();
  }, []);

  async function getNFTs() {
    const alchemy = new Alchemy(settings);
    const account = getAccount();
    // Wallet address
    const address = account.address as string;
    let nftList: any = [];
    // Get all NFTs --------------------------------------------------------------
    let pageKey = "1";
    while (pageKey != null) {
      console.log("heere", pageKey);
      if (pageKey == "1") {
        const transferTime = "transferTime";
        const test: string[] = ["SPAM"];
        const nft = await alchemy.nft.getNftsForOwner(address, { orderBy: transferTime as NftOrdering, excludeFilters: [NftFilters.SPAM] });
        pageKey = nft["pageKey"] as string;
        console.log("222", nft);
        // loop the list and add to nftList while excluding each row ehre the tokenType is equal to "ERC1155"
        nft["ownedNfts"].forEach((element: any) => {
          if (element.rawMetadata?.name !== "" && typeof element.rawMetadata?.name === "string") {
            element.rawMetadata.name = element.rawMetadata?.name?.slice(0, 30);
          }
          if (element["tokenType"] != "ERC1155" && element.rawMetadata?.name) {
            nftList.push(element);
          } else {
            if (element.description?.toLowerCase().includes("reddit") && element.rawMetadata?.name) {
              nftList.push(element);
            }
          }
        });
      } else {
        const nft = await alchemy.nft.getNftsForOwner(address, { pageKey: pageKey });
        pageKey = nft["pageKey"] as string;
        nft["ownedNfts"].forEach((element: any) => {
          if (element.rawMetadata?.name !== "" && typeof element.rawMetadata?.name === "string") {
            element.rawMetadata.name = element.rawMetadata?.name?.slice(0, 30);
          }
          if (element["tokenType"] != "ERC1155" && element.rawMetadata?.name !== "") {
            nftList.push(element);
          } else {
            // check that the element name contains a "reddit" in it
            if (element.description?.toLowerCase().includes("reddit") && element.rawMetadata?.name) {
              nftList.push(element);
            }
          }
        });
      }
      // ONLY WILL GET AROUND 300 NFTS
      if (nftList.length > 200) {
        break;
      }
    }
    // Parse output
    // const nfts2 = await alchemy.nft.getNftsForOwner(address, { pageKey: nfts["pageKey"] });
    console.log("111", nftList);
    console.log("3333", nftList);
    // only the first 10 elements
    setLoadingBar(false);
    setNftList(nftList);
  }

  return (
    <Modal showModal={showNftModal} setShowModal={setShowNftModal}>
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
                return nft.rawMetadata?.name;
              } else if (String(nft.rawMetadata.name).toLowerCase().includes(searching.toLowerCase())) {
                return nft.rawMetadata?.name;
              }
            })
            .map((nft, index) => (
              <div key={index} className="h-auto max-w-full rounded-lg items-center justify-center text-center mb-4 mr-5 ml-5 ">
                <p className="font-mono font-bold">{nft.rawMetadata?.name}</p>
                <div
                  className="relative group cursor-pointer justify-center"
                  onClick={() => {
                    handleSelect(nft);
                    setShowNftModal(false);
                  }}>
                  <img
                    className="rounded-xl shadow-md dark:shadow-gray-800"
                    key={index}
                    src={nft.media[0].gateway}
                    alt="Image"
                    width={300}
                    height={300}
                  />
                  <div className="hidden lg:block opacity-0 group-hover:opacity-100 duration-300 absolute inset-x-0 bottom-0 flex justify-center items-end text-xl bg-blue-200 text-black font-semibold">
                    SELECT
                  </div>
                </div>
                <button
                  className="lg:hidden bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-3 -ml-4"
                  onClick={() => {
                    handleSelect(nft);
                    setShowNftModal(false);
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
export function useNftModal() {
  const [showNftModal, setShowNftModal] = useState(false);

  const NftModalCallback = useCallback(
    ({ onCloseAndSave }: { onCloseAndSave: (data: any) => void }) => {
      return <NftModal showNftModal={showNftModal} setShowNftModal={setShowNftModal} onCloseAndSave={onCloseAndSave} />;
    },
    [showNftModal, setShowNftModal]
  );

  return useMemo(() => ({ setShowNftModal, NftModal: NftModalCallback }), [setShowNftModal, NftModalCallback]);
}
