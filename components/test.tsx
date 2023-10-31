'use client'

import { BaseError } from 'viem'
import { useContractWrite, useWaitForTransaction, useNetwork } from 'wagmi'
import { stringify } from '../utils/stringify'
import GibiStorage from '../GibiStorage.json'
import PixelOpepen from '../PixelOpepen.json'
import { getWalletClient , waitForTransaction} from '@wagmi/core'
import { createPublicClient , http} from 'viem'
import { createTextSpan } from 'typescript'


export function ApproveNFT() {
  const { chain, chains } = useNetwork()
  const { write, data, error, isLoading, isError } = useContractWrite({
    address: "0xfBE2fdA5554f08E22cDc36B70290186cb9f74641",
    abi: GibiStorage.abi,
    functionName: 'createGiveaway',
  })
  const {
    data: receipt,
    isLoading: isPending,
    isSuccess,
  } = useWaitForTransaction({ hash: data?.hash })

  async function handleCreateGiveaway2(tokenId: any) {
    write({
      args: ["0x3DFEc41b65821CC450C177d7B2131c939cEf2eAD",
      tokenId],
    })
  }
  return (
    <>
      <h3>Mint a wagmi</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          const tokenId = formData.get('tokenId')
        }}  
      >
        <input name="tokenId" placeholder="token id" />
        <button disabled={isLoading} type="submit">
          Mint
        </button>
      </form>
    </>
  )
}
