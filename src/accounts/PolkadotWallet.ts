import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { Polkadot } from "@unique-nft/utils/extension";
import { Address } from "@unique-nft/utils";
import {
  BaseWalletEntity,
  BaseWalletType,
  SignerTypeEnum,
} from "./types";

/**
 * Represents the names of the supported Polkadot-based wallets.
 */
export type PolkadotWalletName =
  | "polkadot-js"
  | "subwallet-js"
  | "talisman"
  | "enkrypt"
  | "novawallet";

/**
 * Class representing a Polkadot wallet integration.
 * 
 * @implements {BaseWalletEntity<InjectedAccountWithMeta>}
 */
export class PolkadotWallet
  implements BaseWalletEntity<InjectedAccountWithMeta>
{
  /**
   * A map that holds the accounts associated with this wallet.
   * 
   * @private
   */
  _accounts = new Map<string, BaseWalletType<InjectedAccountWithMeta>>();

  /**
   * The name of the wallet being used.
   * 
   * @type {PolkadotWalletName}
   */
  wallet: PolkadotWalletName;

  constructor(defaultWallet: PolkadotWalletName = "polkadot-js") {
    this.wallet = defaultWallet;
  }

  /**
   * Loads and returns the accounts associated with the connected wallet.
   * 
   * @throws Will throw an error if the account processing fails.
   */
  async getAccounts() {
    const wallets = await Polkadot.loadWalletByName(this.wallet);
    const accountEntries = wallets.accounts
      .filter(({ address }) => Address.is.substrateAddress(address))
      .map((account) => {
        if (!account.address) return null;

        try {
          const normalizedAddress = Address.normalize.substrateAddress(account.address);
          const address = Address.normalize.substrateAddress(account.address, 7391);

          return [
            account.address,
            {
              name: account.meta.name || "",
              normalizedAddress,
              address,
              walletType: this.wallet,
              walletMetaInformation: account,
              signerType: SignerTypeEnum.Polkadot,
              sign: account.signer.sign,
              signer: { ...account.signer, address },
            } as BaseWalletType<InjectedAccountWithMeta>,
          ] as [string, BaseWalletType<InjectedAccountWithMeta>];
        } catch (error) {
          console.error(`Failed to process account ${account.address}:`, error);
          return null;
        }
      })
      .filter((entry): entry is [string, BaseWalletType<InjectedAccountWithMeta>] => entry !== null); // Ensure no null values

    this._accounts = new Map(accountEntries);

    return this._accounts;
  }
}