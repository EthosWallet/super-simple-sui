const bip39 = require('bip39-light');
const nacl = require('tweetnacl');
const { derivePath } = require('ed25519-hd-key');
const {
    Ed25519Keypair, 
    // LocalTxnDataSerializer,
    JsonRpcProvider, 
    Network, 
    RawSigner 
} = require("@mysten/sui.js");

const provider = new JsonRpcProvider(Network.DEVNET);

let keypair;

const signableTransactions = [
    {
        kind: "moveCall",
        data: {
          packageObjectId: "0x0000000000000000000000000000000000000002",
          module: "devnet_nft",
          function: "mint",
          typeArguments: [],
          arguments: [
            "Ethos Example NFT",
            "A sample NFT from Ethos Wallet.",
            "https://ethoswallet.xyz/assets/images/ethos-email-logo.png",
          ],
          gasBudget: 10000,
        }
    }
]

async function trigger() {
    const responsesElement = document.getElementById('responses');
    responsesElement.innerHTML = "";
    // const signer = new RawSigner(keypair, provider, new LocalTxnDataSerializer(provider));
    const signer = new RawSigner(keypair, provider);

    for (let i=0; i<signableTransactions.length; ++i) {
        const signableTransaction = signableTransactions[i];
        const response = await signer.signAndExecuteTransactionWithRequestType(signableTransaction);
        
        const responseElement = document.createElement("DIV");
        responseElement.innerHTML = `<div>
            <h3>Response #${i + 1}</h3>
            <pre>${JSON.stringify(response, null, 4)}</pre>
        </div>`
        responsesElement.append(responseElement)
    }

    getBalance();
}

function generateMnemonic() {
    const mnemonic = bip39.generateMnemonic();
    const cleanMnemonic = mnemonic
            .trim()
            .split(/\s+/)
            .map((part) => part.toLowerCase())
            .join(' ');
    
    return cleanMnemonic;
}

function getMnemonic() {
    let mnemonic = window.localStorage.getItem("simple-sui-mnemonic");
    if (!mnemonic) {
        mnemonic = generateMnemonic();
        window.localStorage.setItem("simple-sui-mnemonic", mnemonic);
    }
    return mnemonic;
}

function address() {
    return "0x" + keypair.getPublicKey().toSuiAddress();
}

function initKeypair() {
    const mnemonic = getMnemonic();
    const path = `m/44'/784'/0'/0'/0'`;
    const seed = bip39.mnemonicToSeed(mnemonic);
    const seedBuffer = Buffer.from(seed).toString('hex');
    const derivedSeed = derivePath(path, seedBuffer).key;
    naclKeypair = nacl.sign.keyPair.fromSeed(
        new Uint8Array(derivedSeed.toJSON().data.slice(0, 32))
    );
    keypair = new Ed25519Keypair(naclKeypair);
}

function initAddress() {
    const addressElement = document.getElementById('address');
    addressElement.innerHTML = address();
    addressElement.href = `https://explorer.devnet.sui.io/addresses/${address()}`
}

function getBalance() {
    try {
        provider.getCoinBalancesOwnedByAddress(address()).then(
            (balances) => {
                console.log("BALANCES", balances)
                const balance = balances.reduce(
                    (t, b, i) => t + b.details.data.fields.balance,
                    0
                )

                document.getElementById('balance').innerHTML = balance;
            }
        )
    } catch (e) {
        console.log("Balance error", e)
    }
}

function useFaucet() {
    try {
        provider.requestSuiFromFaucet(address()).then(getBalance);
    } catch (e) {
        console.log("Faucet error", e);
    }
}

function init() {
    initKeypair();
    initAddress();

    getBalance();
    useFaucet();

    document.getElementById('trigger').onclick = trigger;
}

init();