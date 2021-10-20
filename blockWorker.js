/**
 * This is a miner
 */

const {Blockchain,Block} = require('./blockCHainClasses.js')
const { parentPort } = require('worker_threads')


parentPort.on("message",(message)=>{

    //Re create the parent block chain
    let grizzCoin = Blockchain.createChainFromExisting(message.gc)
    const last = grizzCoin.getLastBlock()

    // Add our miner reward
    const reward = {sender:null,receiver:message.worker,value:grizzCoin.getMinningReward(last.id+1)}
    const transactions = [reward]

    //get any queued transaction (you could implement logic to prefer transactions that have a fee)
    for(let p = 0; p<10;p++){

        let transaction = grizzCoin.getTransactionQueued()
        if(transaction){
            transactions.push(transaction[0])
            if(transaction[1])  transactions.push(transaction[1])
        }
        else{
            break
        }
    }

    //Create the block with the data
    let block = new Block(last.id+1,transactions,Date.now(),last.hash)

    //Work until we find the hash
    block.proofOfWork(grizzCoin.getDifficulty())
    
    //Return
    parentPort.postMessage({block:block})
})
