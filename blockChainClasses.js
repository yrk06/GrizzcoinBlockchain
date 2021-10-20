/**
 * These are the classes for the block chain and the blocks
 */
const SHA256 = require('crypto-js/sha256');

class Blockchain {
    constructor(){
        this.blockchain = []
        this.transactionQueue = []
        this.balances = {}
        this.generateStarterBlock()
    }

    static createChainFromExisting(blockchain){
        let chain = new Blockchain()
        chain.blockchain = []
        blockchain.blockchain.forEach(values =>{
            chain.blockchain.push(Block.createBlockFromExisting(values))
        })
        chain.transactionQueue = blockchain.transactionQueue
        chain.balances = blockchain.balances
        return chain
    }

    getLastBlock(){
        return this.blockchain[this.blockchain.length-1]
    }

    // Block chains have to start somewhere, this is the first block
    generateStarterBlock(){
        let block = new Block(0,[],Date.now(),0)
        this.blockchain.push(block)
    }

    // This function will go through all blocks in the chain and verify their hashes
    verifyChainIntegrity(){
        for(let i = 1; i < this.blockchain.length; i++){
            const currentBlock = this.blockchain[i];
            const precedingBlock= this.blockchain[i-1];

          if(currentBlock.hash !== currentBlock.calculateHash()){
              return false;
          }
          if(currentBlock.prevHash !== precedingBlock.hash)
            return false;
        }
        return true;
    }

    // ~~This function blocks ads on web browser~~
    addBlock(block){

        //Basic check to see if this block is for this chain
        if(this.getLastBlock().hash !== block.prevHash){
            return
        }

        // Test if the block hash is valid (starts with N number of 0)
        const difficulty = this.getDifficulty()
        if(block.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            //console.log('invalid hash')
            return
        }
        //Block hash is valid, now we need to check the contents

        // Check minning reward
        const miner = block.transactionList[0].receiver
        if(block.transactionList[0].value !== this.getMinningReward(block.id)){
            return
        }
        // If this miner is not on record yet, add them
        this.checkExists(miner)
        this.balances[miner] += block.transactionList[0].value

        // Verify all transactions are valid
        // Todo: add digital signature to blocks
        for(let i = 1; i<block.transactionList.length;i++){


            const transaction = block.transactionList[i]
            const sender = transaction.sender
            const receiver = transaction.receiver
            const value = transaction.value

            // The sender must exist and have >= the amount of the transaction
            if(!sender) return
            if(this.balances[sender] < value) return
            
            this.balances[sender] -= value

            //In case this is a fee (miner being payed) then add that to miner balance (must fix)
            if(receiver == "_MINER_"){
                this.balances[miner] += value
            }
            else{

                // If the receiver does not exist yet, create them
                this.checkExists(receiver)
                this.balances[receiver] += value
            }

            //Now lets remove the transactions already processed
            for(let p = 0;p<this.transactionQueue.length;p++){
                const t = this.transactionQueue[p]
                if(t[0] == transaction){
                    this.transactionQueue[p] = null
                }
            }
            this.transactionQueue = this.transactionQueue.filter((value) => value != null)
        }
        //Add the block
        this.blockchain.push(block)
        console.log(`block ${block.hash.substring(4,9)} added to tree. Parent block ${block.prevHash.substring(4,9)}`)
        return true
    }

    // I don't remember when I made this but it works
    // Decrease the mining reward by half every 200 blocks I guess
    getMinningReward(blockId){
        return 10/Math.pow(2,Math.floor((blockId-1)/200))
    }

    // These functions are straight forward
    addTransactionToQueue(transaction){
        this.transactionQueue.push(transaction)
    }
    getTransactionQueued(){
        return this.transactionQueue.shift()
    }
    checkExists(account){
        if(!this.balances[account]){
            this.balances[account] = 0
        }
    }

    // In a perfect world this would work, but it's diffcult to implement in a small scale so I just gave up
    // This function should addapt the current dificulty based on the average time to calculate a block
    getDifficulty(){
        
        let temp_difficulty = 3
        for(let i = 1;i < this.blockchain.length;i++){
            const diff = Math.abs(this.blockchain[i].timestamp - this.blockchain[i-1].timestamp)
            if(diff > 5000){
                temp_difficulty -= (diff-5000)/5000
                temp_difficulty = Math.max(temp_difficulty,1)
            }
            if(diff < 4000){
                temp_difficulty += (4000-diff)/4000
                temp_difficulty = Math.min(temp_difficulty,10)
            }
        }
        return 5
    }
}

// The block is just a big object holding information
class Block{
    constructor(id,transactionList,timestamp,prevHash){
        this.prevHash = prevHash
        this.id = id
        this.transactionList = transactionList
        this.timestamp = timestamp
        this.nonce = 0
        this.hash = this.calculateHash()
    }

    static createBlockFromExisting(blockDict){
        let cblock = new Block(0,0,0,0)
        cblock.prevHash = blockDict.prevHash
        cblock.id = blockDict.id
        cblock.transactionList = blockDict.transactionList
        cblock.timestamp = blockDict.timestamp
        cblock.nonce = blockDict.nonce
        cblock.hash = cblock.calculateHash()
        return cblock
    }

    //This function calculates the hash of the block based on this function
    calculateHash(){
        return SHA256(this.id + this.prevHash + this.timestamp + JSON.stringify(this.transactionList)+this.nonce).toString();
    }

    // The mining work is finding a nonce that gives N amount of 0 in the start of the hash
    proofOfWork(difficulty){
        while(this.hash.substring(0, difficulty) !==Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }        
    }
}

module.exports = {Blockchain,Block}