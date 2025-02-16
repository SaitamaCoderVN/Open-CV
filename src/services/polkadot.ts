// src/services/polkadot.ts
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';

export async function sendPolkadotTransaction(address: string, method: string, args: any[]) {
  const wsProvider = new WsProvider('YOUR_RPC_URL');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  const injector = await web3FromAddress(address);
  
  return new Promise(async (resolve, reject) => {
    try {
      const section = method.split('.')[0];
      const methodName = method.split('.')[1];
      const txHash = await api.tx[section][methodName](...args)
        .signAndSend(address, { signer: injector.signer });
      resolve(txHash);
    } catch (error) {
      reject(error);
    }
  });
}