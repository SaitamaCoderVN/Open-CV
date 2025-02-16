import { SignerTypeEnum } from '@/accounts/types';
import { Address } from 'viem';
export type NFTCard = {
    id: string;
    image: string;
    dateTime: string;
    type: 'facebook' | 'twitter' | 'instagram' | 'other';
    content: string;
};

export class User {
    private _address: string;
    private _nfts: NFTCard[];
    walletType: 'evm' | 'polkadot' | SignerTypeEnum;

    constructor(address: string, nfts: NFTCard[] = []) {
        if (!address) {
            throw new Error("Address is required");
        }
        this._address = address;
        this._nfts = nfts;
        this.walletType = 'evm';
    }

    get address(): string {
        return this._address;
    }

    getNFTs(): NFTCard[] {
        return [...this._nfts]; // Return a copy to prevent direct modification
    }

    addNFT(nft: NFTCard): void {
        if (!nft || !nft.id) {
            throw new Error("Invalid NFT");
        }
        this._nfts.push(nft);
    }
    static fromConnectedWallet(address: Address): User {
        return new User(address);
    }
}