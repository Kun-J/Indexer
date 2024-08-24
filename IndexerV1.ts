import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

//Node URL
const url = '';
//File to save block info
const blockData = 'blockData.json';
//Interval to check for new blocks in ms
const interval = 15000;

interface BlockInfo {
    number: number;
    hash: string;
    parentHash: string;
    nonce: string;
    timestamp: number;
    difficulty: string;
    gasLimit: string;
    gasConsumed: string;
    miner: string;
    transactions: string[];
}

class ChainMonitor {
    private provider: ethers.providers.JsonRpcProvider;
    private lastBlockNum: number;
    private allBlocks: { [blockNum: number]: BlockInfo };

    Constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(url);
        this.lastBlockNum = 0;
        this.allBlocks = {};
    }

    async init() {
        this.loadExistingData();
        const latestBlock = await this.provider.getBlock('latest');
        this.lastBlockNum = Math.max(this.lastBlockNum, latestBlock.number);
        console.log(`Initialized. Starting from block ${this.lastBlockNum}`);
    }

    loadExistingData() {
        if (fs.existsSync(blockData)) {
            const data = fs.readFileSync(blockData, 'utf8');
            this.allBlocks = JSON.parse(data);
            this.lastBlockNum = Math.max(...Object.keys(this.allBlocks).map(Number));
            console.log(`Loaded existing data. Last processed block: ${this.lastBlockNum}`);
        }    
    }

    async monitorBlocks() {
        while (true) {
          try {
            const latestBlock = await this.provider.getBlock('latest');
            
            if (latestBlock.number > this.lastBlockNum) {
              console.log(`New blocks found. Processing blocks ${this.lastBlockNum + 1} to ${latestBlock.number}`);
              
              for (let blockNumber = this.lastBlockNum + 1; blockNumber <= latestBlock.number; blockNumber++) {
                await this.processBlock(blockNumber);
              }
              
              this.lastBlockNum = latestBlock.number;
              this.saveAllBlocksInfo();
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
          } catch (error) {
            console.error('An error occurred:', error);
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
      }
    
    async processBlock(blockNumber: number) {
        const block = await this.provider.getBlock(blockNumber);
        const blockInfo: BlockInfo = {
          number: block.number,
          hash: block.hash,
          parentHash: block.parentHash,
          nonce: block.nonce,
          timestamp: block.timestamp,
          difficulty: block.difficulty.toString(),
          gasLimit: block.gasLimit.toString(),
          gasConsumed: block.gasUsed.toString(),
          miner: block.miner,
          transactions: block.transactions
        };
    
        this.allBlocks[blockNumber] = blockInfo;
        console.log(`Processed block ${blockNumber}`);
    }

    saveAllBlocksInfo() {
        fs.writeFileSync(blockData, JSON.stringify(this.allBlocks, null, 2));
        console.log(`Saved all blocks info to ${blockData}`);
    }

}

async function main() {
    const monitor = new ChainMonitor();
    await monitor.init();
    await monitor.monitorBlocks();
  }
  
  main().catch(console.error);