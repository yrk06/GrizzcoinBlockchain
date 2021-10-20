/**
 * This is a typical blockchain node
 * It will run and mine blocks
 */

const SHA256 = require('crypto-js/sha256');
const workers = require('worker_threads')
const {Blockchain,Block} = require('./blockCHainClasses.js')


// This websocket client will be listening to incoming requests from the central server
const WebSocket = require('ws');
const client = new WebSocket('ws://localhost:8080')

//Received a request from the network
client.on('message',(data)=>{
    const msg = data.toString()


    //If the message starts with 'chain-' it means we received an entire chain of blocks
    if(msg.startsWith('chain-')){

        const incommingChain = JSON.parse(msg.replace('chain-',''))

        // If the new chain is larger then the current one, we accept that as the new chain
        // This makes sure the chain with most work is the valid one
        if(grizzCoin.blockchain.length < incommingChain.blockchain.length){

            // Validate the received chain
            let bcc = Blockchain.createChainFromExisting(incommingChain)

            if(bcc.verifyChainIntegrity()){
                grizzCoin = bcc
                console.log('New Chain accepted')
            }
        }
    }

    // If we receive a new block, then we have to verify it's integrity before adding to the chain
    else if(msg.startsWith('block-')){

        const incommingBlock = JSON.parse(msg.replace('block-',''))

        console.log(`received block ${incommingBlock.hash.substring(4,9)}`)


        if(grizzCoin.addBlock(Block.createBlockFromExisting(incommingBlock))){

            //Terminate the block we are mining (since it's previous hash would be invalid)
            miner.terminate().then((value)=>{

                // logic to stop the block chain after reaching the maxium size
                if(grizzCoin.blockchain.length == max_size){
                    console.log(JSON.stringify(grizzCoin,null,4))
                    return
                }

                //Attempt to mine it again
                mineBlock()
            }) 
        }
        //console.log(JSON.stringify(grizzCoin.balances,null,4))
    }
    //When a new Node joins the party they request a block chain, this is the answer
    else if(msg.startsWith('reqchain-')){
        client.send('chain-'+JSON.stringify(grizzCoin))
    }
    // If a transaction is broadcasted to the network then add it to the queue
    else if(msg.startsWith('transac-')){
        grizzCoin.addTransactionToQueue(null)
    }
    //console.log(msg)
})

client.on('error',(err)=>console.log(err))

//Wait till we are ready and request a chain to work on
client.once('open',() => client.send('reqchain-'))

// While we wait, we start building our own chain
let grizzCoin = new Blockchain()

const { Worker} = require('worker_threads')

const max_size = 500
let miner

function mineBlock(){
    // Workers are basically sub processes because Javascript is single threaded
    miner = new Worker('./blockWorker.js')

    // This message event is between the node and the miner itself, not related to the block chain
    // This specific message is sent by the miner when it finished a block
    miner.once('message', (message)=>{

        // Assemble the block data
        let block = Block.createBlockFromExisting(message.block)
        console.log(`block ${block.hash.substring(4,9)} finished`)

        // Add it to our local chain
        grizzCoin.addBlock(block)

        // Send it to other peers
        client.send('block-'+JSON.stringify(block))


        if(grizzCoin.blockchain.lenght % 10 ==0) console.log('10 blocks done')

        // Get rid of the current miner and start again
        miner.terminate().then((value)=>{
            if(grizzCoin.blockchain.length == max_size){
                console.log(JSON.stringify(grizzCoin,null,4))
                console.log((Date.now() - d0)/(grizzCoin.blockchain.length-1))
                return
            }
            mineBlock()
        }) 
    })

    // Send the block chain and the miner name (for the reward)
    miner.postMessage({gc:grizzCoin,worker:process.argv[2]})
}


console.log('starting to mine')
let d0 = Date.now()
mineBlock()


//The transaction part is pure jank and totally unsafe right now, but it works™

// These are sample transactions
// This one sends 10 coins from yrk06 to grizz and rewards the miner with 1 token
// [{sender:"yrk06",receiver:'grizzlage',value:10},{sender:'yrk06',receiver:"_MINER_",value:1}]

/*grizzCoin.addTransactionToQueue([{sender:"yrk06",receiver:'grizzlage',value:10},{sender:'yrk06',receiver:"_MINER_",value:1}])
grizzCoin.addTransactionToQueue([{sender:"yrk06",receiver:'bellacomeli',value:10},{sender:'yrk06',receiver:"_MINER_",value:1}])
grizzCoin.addTransactionToQueue([{sender:"yrk06",receiver:'brownie',value:10},{sender:'yrk06',receiver:"_MINER_",value:1}])
work("minerBot")*/

//console.log(JSON.stringify(grizzCoin,null,4))
